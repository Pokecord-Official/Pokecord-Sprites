const process = require('process')
const githubAuth = process.argv[2]
if (!githubAuth) throw ('Unauthorized')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dexToPokemon = require('./dexToPokemon.json')
const config = require('./config.json')
const spriteExceptions = async () => {
    try {
        console.log(`⏳ Creating Sprite Exceptions...`)
        const spriteType = config.spriteType
        const parseTree = tree => tree.data.tree.filter(f => f.type === "blob" && f.path.endsWith('.gif')).map(m => parseInt(m.path.split('.')[0]))
        const baseUrl = 'https://api.github.com/repos/Pokecord-Official/Pokecord-Sprites/git/trees/master?recursive=1'
        const writeTo = path.join(__dirname, './spriteExceptions.json')
        const treeData = await axios.get(baseUrl, { headers: { Authorization: `Bearer ${githubAuth}` } })
        const trees = treeData.data.tree.filter(f => f.path.startsWith(spriteType) && !f.path.includes('exceptions') && f.type === 'tree')
        const treesParsed = Object.fromEntries(trees.map(t => t.path === spriteType ? ['front', `${t.url}?recursive=1`] : [t.path.replace(`${spriteType}/`, '').replace(/\//g, '_'), `${t.url}?recursive=1`]))

        const [front, front_shiny, front_female, front_shiny_female, back, back_shiny, back_female, back_shiny_female] = await Promise.all([
            axios.get(treesParsed.front),
            axios.get(treesParsed.shiny),
            axios.get(treesParsed.female),
            axios.get(treesParsed.shiny_female),
            axios.get(treesParsed.back),
            axios.get(treesParsed.back_shiny),
            axios.get(treesParsed.back_female),
            axios.get(treesParsed.back_shiny_female)
        ])

        const frontParsed = parseTree(front)
        const frontShinyParsed = parseTree(front_shiny)
        const frontFemaleParsed = parseTree(front_female)
        const frontFemaleShinyParsed = parseTree(front_shiny_female)

        const backParsed = parseTree(back)
        const backShinyPrsed = parseTree(back_shiny)
        const backFemaleParsed = parseTree(back_female)
        const backFemaleShinyParsed = parseTree(back_shiny_female)

        const dexNumbers = Object.keys(dexToPokemon).map(d => parseInt(d))
        const final = {
            femaleExceptions: [],
            dexExceptions: []
        }
        for (const f of frontFemaleParsed) {
            if (frontFemaleShinyParsed.includes(f) &&
                backFemaleParsed.includes(f) &&
                backFemaleShinyParsed.includes(f)) final.femaleExceptions.push(f)
        }
        for (const d of dexNumbers) {
            if (!frontParsed.includes(d) ||
                !frontShinyParsed.includes(d) ||
                !backParsed.includes(d) ||
                !backShinyPrsed.includes(d)) final.dexExceptions.push(d)
        }
        final.femaleExceptions = final.femaleExceptions.sort((a, b) => a - b)
        final.dexExceptions = final.dexExceptions.sort((a, b) => a - b)
        fs.writeFileSync(writeTo, JSON.stringify(final, null, 4))
        console.log(' ✅ Successfully Created Sprite Exceptions.')
        return true
    } catch (e) {
        console.log(e)
        return false
    }
}
spriteExceptions()