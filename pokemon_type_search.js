async function getMoveType(moveName) {
  const res = await fetch(`https://pokeapi.co/api/v2/move/${moveName}/`);
  if (!res.ok) return null;
  const moveData = await res.json();
  return moveData.type.name; // e.g., "dark", "fire", "electric"
}

async function getRegionalPokemonByType(region, type, statCap, moveType, specificMove) {
  const dexRes = await fetch(`https://pokeapi.co/api/v2/pokedex/${region}/`);
  const dexData = await dexRes.json();

  const speciesList = dexData.pokemon_entries.map(entry => entry.pokemon_species.name);

  const matches = [];
  const availableMoves = new Set(); // to populate the move dropdown

  for (const name of speciesList) {
    try {
      const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}/`);
      if (!pokeRes.ok) continue;

      const pokeData = await pokeRes.json();
      const types = pokeData.types.map(t => t.type.name);
      const totalStats = pokeData.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

      if (!(types.includes(type.toLowerCase()) && totalStats <= statCap)) continue;

      let hasMoveType = !moveType; // if no move type filter, always true
      let hasSpecificMove = !specificMove;

      for (const move of pokeData.moves) {
        const thisMoveType = await getMoveType(move.move.name);

        // Collect possible moves of chosen type
        if (moveType && thisMoveType === moveType.toLowerCase()) {
          availableMoves.add(move.move.name);
          hasMoveType = true;
        }

        // Check specific move filter
        if (specificMove && move.move.name === specificMove.toLowerCase()) {
          hasSpecificMove = true;
        }
      }

      if (hasMoveType && hasSpecificMove) {
        matches.push({
          name: pokeData.name,
          types,
          totalStats
        });
      }
    } catch (err) {
      console.error(`Error fetching ${name}:`, err);
    }
  }

  return { matches, availableMoves: [...availableMoves] };
}

async function findPokemon() {
  const region = document.getElementById("region").value;
  const type = document.getElementById("type").value;
  const statCap = parseInt(document.getElementById("statCap").value, 10);
  const moveType = document.getElementById("moveType").value;
  const specificMove = document.getElementById("moveName").value;
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "<p>Loading...</p>";

  const { matches, availableMoves } = await getRegionalPokemonByType(region, type, statCap, moveType, specificMove);

  /* This has been commented out as a means of testing. If if doesn't work as intended please remove the comments
  // Populate move dropdown if a move type was selected
  const moveDropdown = document.getElementById("moveName");
  moveDropdown.innerHTML = '<option value="">Any</option>';
  availableMoves.sort().forEach(move => {
    const opt = document.createElement("option");
    opt.value = move;
    opt.textContent = move;
    moveDropdown.appendChild(opt);
  });
   */

  if (matches.length === 0) {
    resultsDiv.innerHTML = "<p>No Pokémon found.</p>";
    return;
  }

  resultsDiv.innerHTML = "";
  matches.forEach(p => {
    const div = document.createElement("div");
    div.className = "pokemon";
    div.textContent = `${p.name} (${p.types.join(", ")}) - Total Stats: ${p.totalStats}`;
    resultsDiv.appendChild(div);
  });
}

document.getElementById("moveType").addEventListener("change", async () => {
  const region = document.getElementById("region").value;
  const type = document.getElementById("type").value;
  const statCap = parseInt(document.getElementById("statCap").value, 10);
  const moveType = document.getElementById("moveType").value;

  // Call your existing function but with no specific move filter
  const { availableMoves } = await getRegionalPokemonByType(region, type, statCap, moveType, null);

  const moveDropdown = document.getElementById("moveName");
  moveDropdown.innerHTML = '<option value="">Any</option>';
  availableMoves.sort().forEach(move => {
    const opt = document.createElement("option");
    opt.value = move;
    opt.textContent = move;
    moveDropdown.appendChild(opt);
  });
});

