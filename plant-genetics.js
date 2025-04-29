// Plant Genetics System
// This module implements a genetic system for plants that can be integrated
// with the existing garden game.

// ============== GENE DEFINITION AND MAPPING ==============

// Define gene traits and their possible values
const GENE_TRAITS = {
    // Visual Traits
    FC: { // Flower Color
        name: "Flower Color",
        type: "qualitative",
        alleles: {
            R: { name: "Red", dominance: 2, value: "#FF5555" },
            B: { name: "Blue", dominance: 2, value: "#5555FF" },
            Y: { name: "Yellow", dominance: 2, value: "#FFFF55" },
            W: { name: "White", dominance: 1, value: "#FFFFFF" },
            P: { name: "Pink", dominance: 2, value: "#FF55FF" },
        },
        // How alleles blend when heterozygous
        blendMap: {
            "RB": { name: "Purple", value: "#9955FF" },
            "RY": { name: "Orange", value: "#FF9955" },
            "BY": { name: "Green", value: "#55FF55" },
            "RW": { name: "Light Red", value: "#FF9999" },
            "BW": { name: "Light Blue", value: "#9999FF" },
            "YW": { name: "Light Yellow", value: "#FFFF99" },
            "RP": { name: "Deep Pink", value: "#FF5599" },
            "BP": { name: "Purple", value: "#9955FF" },
            "YP": { name: "Peach", value: "#FFAA77" },
        },
        defaultValue: "WW"
    },
    SZ: { // Size
        name: "Size",
        type: "quantitative",
        min: 1,
        max: 5,
        defaultValue: 3,
        // Mapping of size values to visual and gameplay effects
        valueMap: {
            1: { scale: 0.7, growthModifier: 1.2, waterModifier: 0.8 },
            2: { scale: 0.85, growthModifier: 1.1, waterModifier: 0.9 },
            3: { scale: 1.0, growthModifier: 1.0, waterModifier: 1.0 },
            4: { scale: 1.15, growthModifier: 0.9, waterModifier: 1.1 },
            5: { scale: 1.3, growthModifier: 0.8, waterModifier: 1.2 }
        }
    },
    LS: { // Leaf Shape
        name: "Leaf Shape",
        type: "qualitative",
        alleles: {
            1: { name: "Oval", dominance: 2, value: "oval" },
            2: { name: "Heart", dominance: 2, value: "heart" },
            3: { name: "Pointed", dominance: 2, value: "pointed" },
        },
        defaultValue: "11"
    },
    BP: { // Branching Pattern
        name: "Branching Pattern",
        type: "quantitative",
        min: 1,
        max: 3,
        defaultValue: 1,
        valueMap: {
            1: { branches: 1, angle: 0 },
            2: { branches: 2, angle: 30 },
            3: { branches: 3, angle: 25 }
        }
    },
    
    // Statistical Traits
    GR: { // Growth Rate
        name: "Growth Rate",
        type: "quantitative",
        min: 0.5,
        max: 1.5,
        defaultValue: 1.0,
        // How growth rate affects the plant's development
        valueMap: {
            0.5: { daysToMature: 15 },
            0.7: { daysToMature: 12 },
            1.0: { daysToMature: 10 },
            1.2: { daysToMature: 8 },
            1.5: { daysToMature: 6 }
        }
    },
    YD: { // Yield
        name: "Yield",
        type: "quantitative",
        min: 1,
        max: 5,
        defaultValue: 3,
        // Mapping yield to game rewards
        valueMap: {
            1: { coinMultiplier: 0.8, seedChance: 0.3 },
            2: { coinMultiplier: 0.9, seedChance: 0.4 },
            3: { coinMultiplier: 1.0, seedChance: 0.5 },
            4: { coinMultiplier: 1.2, seedChance: 0.6 },
            5: { coinMultiplier: 1.5, seedChance: 0.7 }
        }
    },
    RS: { // Resistance
        name: "Resistance",
        type: "quantitative",
        min: 1,
        max: 3,
        defaultValue: 2,
        // How resistance affects vulnerability to pests and weather
        valueMap: {
            1: { pestDamageChance: 0.5, weatherDamageChance: 0.4 },
            2: { pestDamageChance: 0.2, weatherDamageChance: 0.2 },
            3: { pestDamageChance: 0.05, weatherDamageChance: 0.05 }
        }
    },
    WN: { // Water Needs
        name: "Water Needs",
        type: "quantitative",
        min: 1,
        max: 3,
        defaultValue: 2,
        // Daily water requirements
        valueMap: {
            1: { waterPerDay: 10, droughtResistance: 0.7 },
            2: { waterPerDay: 20, droughtResistance: 0.5 },
            3: { waterPerDay: 30, droughtResistance: 0.3 }
        }
    }
};

// ============== PLANT CLASS ==============

// Plant class to hold a plant instance with its genes and phenotype
class Plant {
    constructor(geneSequence = null) {
        // Initialize with default genes if no sequence provided
        this.genes = this.parseGeneSequence(geneSequence || this.generateDefaultGeneSequence());
        this.phenotype = this.calculatePhenotype();
        this.progress = 0; // Growth progress (0-100%)
        this.health = 100; // Plant health
        this.ready = false; // Ready to harvest
        this.watered = true; // Currently watered
    }

    // Parse a gene sequence string like "FC:RB-SZ:3-LS:1-YD:4-RS:2"
    parseGeneSequence(sequence) {
        const genes = {};
        
        // Split the sequence by dashes and process each gene segment
        const geneSegments = sequence.split('-');
        
        geneSegments.forEach(segment => {
            const [geneKey, value] = segment.split(':');
            
            // Validate the gene key exists
            if (!GENE_TRAITS[geneKey]) {
                console.warn(`Unknown gene key: ${geneKey}, using default`);
                genes[geneKey] = GENE_TRAITS[geneKey]?.defaultValue || "00";
                return;
            }
            
            genes[geneKey] = value;
        });
        
        // Fill in any missing genes with defaults
        Object.keys(GENE_TRAITS).forEach(key => {
            if (!genes[key]) {
                genes[key] = GENE_TRAITS[key].defaultValue;
            }
        });
        
        return genes;
    }
    
    // Generate a default gene sequence with all traits
    generateDefaultGeneSequence() {
        const segments = [];
        
        Object.keys(GENE_TRAITS).forEach(key => {
            segments.push(`${key}:${GENE_TRAITS[key].defaultValue}`);
        });
        
        return segments.join('-');
    }
    
    // Convert the genotype (genes) to phenotype (observable traits)
    calculatePhenotype() {
        const phenotype = {};
        
        // Process each gene to determine its effect
        Object.keys(this.genes).forEach(key => {
            const gene = GENE_TRAITS[key];
            const value = this.genes[key];
            
            if (!gene) return;
            
            // Handle different types of traits
            if (gene.type === "qualitative") {
                // For qualitative traits, check for blend or dominant allele
                if (value[0] === value[1]) {
                    // Homozygous - use the allele's value
                    phenotype[key] = gene.alleles[value[0]];
                } else {
                    // Heterozygous - check for blending
                    const sortedAlleles = [value[0], value[1]].sort().join("");
                    
                    if (gene.blendMap && gene.blendMap[sortedAlleles]) {
                        // Use the pre-defined blend
                        phenotype[key] = gene.blendMap[sortedAlleles];
                    } else {
                        // Use dominant allele if no blend is defined
                        const allele1 = gene.alleles[value[0]];
                        const allele2 = gene.alleles[value[1]];
                        
                        if (!allele1 || !allele2) {
                            phenotype[key] = gene.alleles[Object.keys(gene.alleles)[0]];
                        } else if (allele1.dominance > allele2.dominance) {
                            phenotype[key] = allele1;
                        } else if (allele2.dominance > allele1.dominance) {
                            phenotype[key] = allele2;
                        } else {
                            // Equal dominance, use the first one
                            phenotype[key] = allele1;
                        }
                    }
                }
            } else if (gene.type === "quantitative") {
                // For quantitative traits, calculate the numerical value
                let numericValue;
                
                // Convert the gene value to a number
                if (typeof value === 'string' && value.length === 2) {
                    // For diploid genes, average the two allele values
                    const allele1 = parseInt(value[0], 10) || gene.min;
                    const allele2 = parseInt(value[1], 10) || gene.min;
                    numericValue = Math.round((allele1 + allele2) / 2);
                } else {
                    // For haploid genes, use the value directly
                    numericValue = parseInt(value, 10) || gene.defaultValue;
                }
                
                // Clamp to valid range
                numericValue = Math.max(gene.min, Math.min(gene.max, numericValue));
                
                // Set the value and map to the corresponding properties
                phenotype[key] = {
                    value: numericValue,
                    ...gene.valueMap[numericValue]
                };
            }
        });
        
        // Calculate derived traits with interactions
        this.calculateTraitInteractions(phenotype);
        
        return phenotype;
    }
    
    // Calculate how traits interact with each other
    calculateTraitInteractions(phenotype) {
        // Growth Rate (GR) affects time to mature and is affected by Size (SZ)
        if (phenotype.GR && phenotype.SZ) {
            const sizeEffect = phenotype.SZ.growthModifier || 1.0;
            phenotype.GR.effectiveValue = phenotype.GR.value * sizeEffect;
            
            // Recalculate days to mature based on effective growth rate
            const baseGrowthDays = GENE_TRAITS.GR.valueMap[phenotype.GR.value]?.daysToMature || 10;
            phenotype.GR.daysToMature = Math.round(baseGrowthDays / sizeEffect);
        }
        
        // Water Needs (WN) is affected by Size (SZ)
        if (phenotype.WN && phenotype.SZ) {
            const sizeEffect = phenotype.SZ.waterModifier || 1.0;
            const baseWaterNeeds = phenotype.WN.waterPerDay || 20;
            phenotype.WN.effectiveWaterPerDay = Math.round(baseWaterNeeds * sizeEffect);
        }
        
        // High Growth Rate (GR) reduces Resistance (RS)
        if (phenotype.GR && phenotype.RS && phenotype.GR.value > 1.2) {
            // Growth-resistance trade-off
            phenotype.RS.effectivePestDamageChance = 
                phenotype.RS.pestDamageChance * (1 + (phenotype.GR.value - 1.0) * 0.5);
            
            // Ensure it doesn't exceed 100%
            phenotype.RS.effectivePestDamageChance = 
                Math.min(1.0, phenotype.RS.effectivePestDamageChance);
        } else if (phenotype.RS) {
            phenotype.RS.effectivePestDamageChance = phenotype.RS.pestDamageChance;
        }
        
        // Check for inbreeding depression (same alleles)
        let homozygousCount = 0;
        
        Object.keys(this.genes).forEach(key => {
            const value = this.genes[key];
            if (typeof value === 'string' && value.length === 2 && value[0] === value[1]) {
                homozygousCount++;
            }
        });
        
        // If more than 5 genes are homozygous, apply inbreeding depression
        const inbreedingThreshold = 5;
        if (homozygousCount > inbreedingThreshold) {
            // Reduce yield due to inbreeding
            if (phenotype.YD) {
                const inbreedingFactor = 1.0 - ((homozygousCount - inbreedingThreshold) * 0.1);
                phenotype.YD.effectiveCoinMultiplier = phenotype.YD.coinMultiplier * inbreedingFactor;
            }
        } else if (phenotype.YD) {
            phenotype.YD.effectiveCoinMultiplier = phenotype.YD.coinMultiplier;
        }
    }
    
    // Convert genes back to a gene sequence string
    toGeneSequence() {
        const segments = [];
        
        Object.keys(this.genes).forEach(key => {
            segments.push(`${key}:${this.genes[key]}`);
        });
        
        return segments.join('-');
    }
    
    // Get basic info about the plant for UI display
    getInfo() {
        // Calculate maturity time based on growth rate
        const daysToMature = this.phenotype.GR?.daysToMature || 10;
        
        // Flower color for display
        let flowerColorName = "Unknown";
        let flowerColorValue = "#FFFFFF";
        
        if (this.phenotype.FC) {
            flowerColorName = this.phenotype.FC.name;
            flowerColorValue = this.phenotype.FC.value;
        }
        
        // Leaf shape for display
        let leafShapeName = "Unknown";
        
        if (this.phenotype.LS) {
            leafShapeName = this.phenotype.LS.name;
        }
        
        // Calculate expected sell price
        const basePrice = 10; // Base price for a standard plant
        const yieldMultiplier = this.phenotype.YD?.effectiveCoinMultiplier || 1.0;
        const sellPrice = Math.round(basePrice * yieldMultiplier);
        
        return {
            name: `${flowerColorName} ${leafShapeName} Plant`,
            flowerColor: flowerColorValue,
            leafShape: this.phenotype.LS?.value || "oval",
            size: this.phenotype.SZ?.value || 3,
            growthDays: daysToMature,
            waterNeeds: this.phenotype.WN?.effectiveWaterPerDay || 20,
            resistance: Math.round((1 - (this.phenotype.RS?.effectivePestDamageChance || 0.2)) * 100),
            sellPrice: sellPrice,
            // Visual representation
            emoji: this.getEmoji(),
            growth: this.progress,
            isReady: this.ready
        };
    }
    
    // Get appropriate emoji based on flower color
    getEmoji() {
        if (!this.phenotype.FC) return "🌱";
        
        // Map colors to appropriate emoji
        const colorName = this.phenotype.FC.name.toLowerCase();
        
        const emojiMap = {
            "red": "🌹",
            "blue": "🌸",
            "yellow": "🌻",
            "white": "🌼",
            "pink": "🌷",
            "purple": "💐",
            "orange": "🌺",
            "green": "🌿",
            "light red": "🌹",
            "light blue": "🌸",
            "light yellow": "🌼",
            "deep pink": "🌷",
            "peach": "🌺"
        };
        
        return emojiMap[colorName] || "🌱";
    }
    
    // Update plant growth based on game conditions
    update(waterLevel = 100, pestPresent = false, weatherEvent = null) {
        // Skip update if already harvested
        if (this.ready) return;
        
        // Base growth per day (1-10%)
        let growthIncrement = 10;
        
        // Apply growth rate modifier
        if (this.phenotype.GR) {
            growthIncrement *= (this.phenotype.GR.effectiveValue || this.phenotype.GR.value);
        }
        
        // Water effect (if below water needs)
        const waterNeeds = this.phenotype.WN?.effectiveWaterPerDay || 20;
        if (waterLevel < waterNeeds) {
            // Reduce growth if under-watered
            const waterRatio = waterLevel / waterNeeds;
            growthIncrement *= waterRatio;
            
            // Reduce health if severely under-watered
            if (waterRatio < 0.5) {
                this.health -= (1 - waterRatio) * 5;
            }
            
            this.watered = false;
        } else {
            this.watered = true;
        }
        
        // Pest damage
        if (pestPresent) {
            const damageChance = this.phenotype.RS?.effectivePestDamageChance || 0.2;
            
            if (Math.random() < damageChance) {
                // Reduce growth and health
                growthIncrement *= 0.5;
                this.health -= 10;
            }
        }
        
        // Weather effects
        if (weatherEvent) {
            const weatherDamageChance = this.phenotype.RS?.weatherDamageChance || 0.2;
            
            if (weatherEvent === "drought") {
                // Drought affects plants based on water needs
                const droughtResistance = this.phenotype.WN?.droughtResistance || 0.5;
                
                if (Math.random() > droughtResistance) {
                    growthIncrement *= 0.3;
                    this.health -= 15;
                }
            } else if (weatherEvent === "storm") {
                // Storms affect plants based on size and resistance
                const size = this.phenotype.SZ?.value || 3;
                // Larger plants are more vulnerable to storms
                const stormVulnerability = size / 5;
                
                if (Math.random() < (weatherDamageChance * stormVulnerability)) {
                    growthIncrement = 0;
                    this.health -= 20;
                }
            }
        }
        
        // Apply growth
        this.progress += growthIncrement;
        
        // Cap progress at 100%
        if (this.progress >= 100) {
            this.progress = 100;
            this.ready = true;
        }
        
        // Cap health at 0-100
        this.health = Math.max(0, Math.min(100, this.health));
        
        // If health reaches 0, plant dies
        if (this.health <= 0) {
            this.health = 0;
            return { event: "died" };
        }
        
        // Return ready state if the plant just matured
        if (this.ready) {
            return { event: "matured" };
        }
        
        return { event: "growing" };
    }
    
    // Harvest the plant and get rewards
    harvest() {
        if (!this.ready) {
            return { success: false, message: "Plant not ready for harvest" };
        }
        
        // Calculate rewards based on yield
        const yieldMultiplier = this.phenotype.YD?.effectiveCoinMultiplier || 1.0;
        const baseCoins = 10;
        const coins = Math.round(baseCoins * yieldMultiplier);
        
        // Calculate seed rewards
        const seedChance = this.phenotype.YD?.seedChance || 0.5;
        const seeds = Math.random() < seedChance ? 1 : 0;
        
        return {
            success: true,
            rewards: {
                coins: coins,
                seeds: seeds,
                geneSequence: this.toGeneSequence() // Return the gene sequence for breeding
            },
            message: `Harvested ${this.getInfo().name} for ${coins} coins and ${seeds} seeds!`
        };
    }
}

// ============== BREEDING MECHANICS ==============

// Breeding class to handle crossing plants
class PlantBreeder {
    constructor() {
        this.crossingHistory = [];
    }
    
    // Cross two plants to create offspring
    crossPlants(plantA, plantB) {
        // Ensure valid plants
        if (!plantA || !plantB) {
            return null;
        }
        
        // Get gene sequences
        const genesA = plantA.genes;
        const genesB = plantB.genes;
        
        // Create new gene sequence by combining alleles
        const offspringGenes = {};
        
        Object.keys(GENE_TRAITS).forEach(key => {
            // Skip if gene doesn't exist in either parent
            if (!genesA[key] || !genesB[key]) {
                offspringGenes[key] = GENE_TRAITS[key].defaultValue;
                return;
            }
            
            let newGene;
            
            // Handle different gene types
            if (GENE_TRAITS[key].type === "qualitative") {
                // For diploid genes, take one allele from each parent
                // First parent contributes first allele
                const alleleA = typeof genesA[key] === 'string' && genesA[key].length >= 1 ? 
                    genesA[key][Math.floor(Math.random() * genesA[key].length)] : 
                    Object.keys(GENE_TRAITS[key].alleles)[0];
                
                // Second parent contributes second allele
                const alleleB = typeof genesB[key] === 'string' && genesB[key].length >= 1 ? 
                    genesB[key][Math.floor(Math.random() * genesB[key].length)] : 
                    Object.keys(GENE_TRAITS[key].alleles)[0];
                
                newGene = alleleA + alleleB;
            } else if (GENE_TRAITS[key].type === "quantitative") {
                // For quantitative traits, average the values with some variation
                let valueA, valueB;
                
                // Extract numeric values
                if (typeof genesA[key] === 'string' && genesA[key].length === 2) {
                    valueA = (parseInt(genesA[key][0], 10) + parseInt(genesA[key][1], 10)) / 2;
                } else {
                    valueA = parseInt(genesA[key], 10);
                }
                
                if (typeof genesB[key] === 'string' && genesB[key].length === 2) {
                    valueB = (parseInt(genesB[key][0], 10) + parseInt(genesB[key][1], 10)) / 2;
                } else {
                    valueB = parseInt(genesB[key], 10);
                }
                
                // Handle NaN
                valueA = isNaN(valueA) ? GENE_TRAITS[key].defaultValue : valueA;
                valueB = isNaN(valueB) ? GENE_TRAITS[key].defaultValue : valueB;
                
                // Calculate average with random variation
                const averageValue = (valueA + valueB) / 2;
                const variation = Math.random() * 0.6 - 0.3; // -0.3 to +0.3
                let finalValue = Math.round(averageValue + variation);
                
                // Ensure value is within valid range
                finalValue = Math.max(GENE_TRAITS[key].min, Math.min(GENE_TRAITS[key].max, finalValue));
                
                // For diploid numeric genes, represent as a string of two digits
                newGene = `${finalValue}${finalValue}`;
            }
            
            // Apply random mutation (5% chance per gene)
            if (Math.random() < 0.05) {
                newGene = this.mutateMutation(newGene, key);
            }
            
            offspringGenes[key] = newGene;
        });
        
        // Convert genes object to sequence string
        const geneSequence = Object.keys(offspringGenes)
            .map(key => `${key}:${offspringGenes[key]}`)
            .join('-');
        
        // Create new plant with the gene sequence
        const offspring = new Plant(geneSequence);
        
        // Record the crossing in history
        this.crossingHistory.push({
            parentA: plantA.toGeneSequence(),
            parentB: plantB.toGeneSequence(),
            offspring: offspring.toGeneSequence(),
            date: new Date()
        });
        
        return offspring;
    }
    
    // Apply random mutation to a gene
    mutateMutation(gene, geneKey) {
        const trait = GENE_TRAITS[geneKey];
        
        if (!trait) return gene;
        
        if (trait.type === "qualitative") {
            // For qualitative traits, randomly change one allele
            const alleleKeys = Object.keys(trait.alleles);
            if (alleleKeys.length === 0) return gene;
            
            // Randomly choose which allele to mutate (first or second)
            const alleleIndex = Math.floor(Math.random() * gene.length);
            
            // Choose a new random allele
            const newAllele = alleleKeys[Math.floor(Math.random() * alleleKeys.length)];
            
            // Create the mutated gene
            return alleleIndex === 0 ? 
                newAllele + gene[1] : 
                gene[0] + newAllele;
        } else if (trait.type === "quantitative") {
            // For quantitative traits, increase or decrease by 1
            let value;
            
            if (typeof gene === 'string' && gene.length === 2) {
                // For diploid genes, take the average
                value = (parseInt(gene[0], 10) + parseInt(gene[1], 10)) / 2;
            } else {
                value = parseInt(gene, 10);
            }
            
            // Handle NaN
            if (isNaN(value)) value = trait.defaultValue;
            
            // Random increase or decrease
            value += Math.random() < 0.5 ? -1 : 1;
            
            // Ensure within bounds
            value = Math.max(trait.min, Math.min(trait.max, Math.round(value)));
            
            // For diploid genes, return string representation
            return `${value}${value}`;
        }
        
        return gene;
    }
    
    // Get crossing history
    getCrossingHistory() {
        return this.crossingHistory;
    }
}

// ============== INTEGRATION HELPERS ==============

// Helper to create a new random plant
function createRandomPlant() {
    // Generate random genes for each trait
    const genes = {};
    
    Object.keys(GENE_TRAITS).forEach(key => {
        const trait = GENE_TRAITS[key];
        
        if (trait.type === "qualitative") {
            // For qualitative traits, randomly select alleles
            const alleleKeys = Object.keys(trait.alleles);
            const allele1 = alleleKeys[Math.floor(Math.random() * alleleKeys.length)];
            const allele2 = alleleKeys[Math.floor(Math.random() * alleleKeys.length)];
            genes[key] = allele1 + allele2;
        } else if (trait.type === "quantitative") {
            // For quantitative traits, randomly select value within range
            const value = Math.floor(Math.random() * (trait.max - trait.min + 1)) + trait.min;
            genes[key] = `${value}${value}`;
        }
    });
    
    // Create gene sequence
    const geneSequence = Object.keys(genes)
        .map(key => `${key}:${genes[key]}`)
        .join('-');
    
    return new Plant(geneSequence);
}

// Helper to create starter plants of specific types
function createStarterPlant(type) {
    let geneSequence;
    
    switch (type) {
        case "carrot":
            // Carrot-like plant (orange, fast growing, high yield)
            geneSequence = "FC:RY-SZ:22-LS:33-BP:11-GR:12-YD:44-RS:22-WN:22";
            break;
        case "tomato":
            // Tomato-like plant (red, medium size, resistant)
            geneSequence = "FC:RR-SZ:33-LS:11-BP:22-GR:10-YD:33-RS:33-WN:22";
            break;
        case "corn":
            // Corn-like plant (yellow, tall, high yield, high water needs)
            geneSequence = "FC:YY-SZ:55-LS:33-BP:33-GR:08-YD:55-RS:22-WN:33";
            break;
        default:
            // Generic starter plant
            geneSequence = "FC:RB-SZ:33-LS:11-BP:11-GR:10-YD:33-RS:22-WN:22";
    }
    
    return new Plant(geneSequence);
}

// ============== INTEGRATION WITH EXISTING GAME ==============

// This function initializes the genetics system in the game
function initializeGeneticsSystem(game) {
    // Add plant types to the game
    game.plantTypes = {
        carrot: {
            name: "Carrot",
            emoji: