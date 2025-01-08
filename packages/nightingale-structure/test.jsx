import React, { useState, useEffect } from 'react';

// This component assumes that the Nightingale library has been included in your project via script tag or import map in your index.html
function NightingaleStructureTest() {
  const [lipScores, setLipScores] = useState(new Array(200).fill(100));
  const lipScoreString = JSON.stringify(lipScores);

  useEffect(() => {
    // Simulating data update for dynamic testing
    const interval = setInterval(() => {
      setLipScores(lipScores.map(score => score === 100 ? 90 : 100));
    }, 5000);

    return () => clearInterval(interval);
  }, [lipScores]);

  return (
    <div>
      <h1>Nightingale Structure Test</h1>
      <nightingale-structure
        protein-accession="P25443"
        structure-id="AF-P25443-F1"
        highlight-color="#FF6699"
        lipscore-array={lipScoreString}
      ></nightingale-structure>
    </div>
  );
}

export default NightingaleStructureTest;
