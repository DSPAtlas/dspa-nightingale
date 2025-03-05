import React, { useEffect, useState, useRef } from "react";
import "@nightingale-elements/nightingale-sequence";
import "@nightingale-elements/nightingale-navigation";
import "@nightingale-elements/nightingale-manager";
import "@nightingale-elements/nightingale-track";
import "@nightingale-elements/nightingale-structure";

const NightingaleComponent = () => {
    const accession = "P05067";
    
    // State to store API data
    const [featuresData, setFeaturesData] = useState(null);
    const [error, setError] = useState(null);

    // Refs for nightingale elements
    const sequenceRef = useRef(null);
    const coloredSequenceRef = useRef(null);
    const domainRef = useRef(null);
    const regionRef = useRef(null);
    const siteRef = useRef(null);
    const bindingRef = useRef(null);
    const chainRef = useRef(null);
    const disulfideRef = useRef(null);
    const betaStrandRef = useRef(null);

    // Fetch features data
    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const response = await fetch(`https://www.ebi.ac.uk/proteins/api/features/${accession}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch protein data");
                }
                const data = await response.json();
                setFeaturesData(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchFeatures();
    }, [accession]); // Runs only when accession changes

    // Update Nightingale components when data is available
    useEffect(() => {
        if (!featuresData) return;
        console.log("features data", featuresData);

        const sequence = featuresData.sequence;
        const features = featuresData.features.map((ft) => ({
            ...ft,
            start: ft.start || ft.begin, // Adjust start property for Nightingale
        }));

        console.log("features", features);

        if (sequenceRef.current) {
            sequenceRef.current.data = sequence;
        }
        if (coloredSequenceRef.current) {
            coloredSequenceRef.current.data = sequence;
        }
        if (domainRef.current) {
            domainRef.current.data = features.filter(({ type }) => type === "DOMAIN");
        }
        if (regionRef.current) {
            regionRef.current.data = features.filter(({ type }) => type === "REGION");
        }
        if (siteRef.current) {
            siteRef.current.data = features.filter(({ type }) => type === "SITE");
        }
        if (bindingRef.current) {
            bindingRef.current.data = features.filter(({ type }) => type === "BINDING");
        }
        if (chainRef.current) {
            chainRef.current.data = features.filter(({ type }) => type === "CHAIN");
        }
        if (disulfideRef.current) {
            disulfideRef.current.data = features.filter(({ type }) => type === "DISULFID");
        }
        if (betaStrandRef.current) {
            betaStrandRef.current.data = features.filter(({ type }) => type === "STRAND");
        }
    }, [featuresData]); // Runs when featuresData changes

    return (
       
        <div>
            <h2>Nightingale Component</h2>
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {!featuresData && <p>Loading...</p>}

            {featuresData && (
               <nightingale-manager>
               <nightingale-structure protein-accession="P05067"
                  structure-id="4YC3">
               </nightingale-structure>
               <table>
                 <tbody>
                   <tr>
                     <td></td>
                     <td>
                       <nightingale-navigation
                         id="navigation"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="white"
                       ></nightingale-navigation>
                     </td>
                   </tr>
                   <tr>
                     <td></td>
                     <td>
                       <nightingale-sequence
                        ref={sequenceRef}
                         id="sequence"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="white"
                         highlight-event="onmouseover"
                       ></nightingale-sequence>
                     </td>
                   </tr>
                   <tr>
                     <td></td>
                     <td>
                       <nightingale-colored-sequence
                         id="colored-sequence"
                         min-width="800"
                         height="15"
                         length="770"
                         display-start="1"
                         display-end="770"
                         scale="hydrophobicity-scale"
                         margin-color="white"
                         highlight-event="onmouseover"
                       >
                       </nightingale-colored-sequence>
                     </td>
                   </tr>
                   <tr>
                     <td>Domain</td>
                     <td>
                       <nightingale-track
                        ref={domainRef}
                         id="domain"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                   <tr>
                     <td>Region</td>
                     <td>
                       <nightingale-track
                       ref={regionRef}
                         id="region"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                   <tr>
                     <td>Site</td>
                     <td>
                       <nightingale-track
                        ref={siteRef}
                         id="site"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                   <tr>
                     <td>Chain</td>
                     <td>
                       <nightingale-track
                        ref={chainRef}
                         id="chain"
                         layout="non-overlapping"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                   <tr>
                     <td>Binding site</td>
                     <td>
                       <nightingale-track
                        ref={bindingRef}
                         id="binding"
                         min-width="800"
                         height="40"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                   <tr>
                     <td>Disulfide bond</td>
                     <td>
                       <nightingale-track
                        ref={disulfideRef}
                         id="disulfide-bond"
                         layout="non-overlapping"
                         min-width="800"
                         height="15"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                   <tr>
                     <td>Beta strand</td>
                     <td>
                       <nightingale-track
                        ref={betaStrandRef}
                         id="beta-strand"
                         min-width="800"
                         height="15"
                         length="770"
                         display-start="1"
                         display-end="770"
                         margin-color="aliceblue"
                         highlight-event="onmouseover"
                       ></nightingale-track>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </nightingale-manager>
            )}
        </div>
    );
};

export default NightingaleComponent;
