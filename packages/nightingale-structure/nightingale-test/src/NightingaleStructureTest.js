import React, { useEffect, useRef } from 'react';
import "@dspa-nightingale/nightingale-structure";


const NightingaleComponent = () => {
    const structureRef = useRef(null);

    useEffect(() => {
        if (structureRef.current) {
            // Setting up the properties for the nightingale-structure
            structureRef.current.setAttribute('protein-accession', 'P05067'); // Hard-coded protein accession
            structureRef.current.setAttribute('structure-id', 'AF-P05067-F1'); // Hard-coded structure ID
            structureRef.current.setAttribute('highlight-color', '#FF6699');
            structureRef.current.setAttribute('lipscore-array', JSON.stringify(Array(770).fill(100))); // Example LipScore array
        }
    }, []);

    return (
        <div>
            <h1>Nightingale Structure Display</h1>
            <nightingale-structure ref={structureRef}></nightingale-structure>
        </div>
    );
};

export default NightingaleComponent;
