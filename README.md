# DOE for multipass

# Scherrmann Lab Microreactor DoE Suite

Welcome to the **Scherrmann Lab Microreactor DoE (Design of Experiments) Suite**. This repository contains two interconnected HTML/JavaScript applications designed to plan, execute, and analyze continuous-flow microreactor experiments. 

These tools operate entirely client-side in the browser, requiring no external server or backend.

---

## 1: Microreactor Experiment Planner (`plan_MCS_v13.html`)

[cite_start]The Experiment Planner generates highly specific, mathematically rigorous JSON experiment plans based on user-defined chemical and physical parameters[cite: 6]. [cite_start]It calculates precise pump flow rates, slug tracking, collection times, and syringe refill schedules[cite: 6]. [cite_start]The web interface includes a dynamic version number in its footer (e.g., Version: 20250606_094500) reflecting the date and time the script was loaded in your browser[cite: 7]. [cite_start]This specific documentation aligns with Document Version 2025-06-26[cite: 3].

This JSON file is used in our lab in a specific system programmed in Labview.

### [cite_start]I. Input Parameters [cite: 9]
[cite_start]The planner uses several input parameters, organized into cards on the user interface[cite: 10]. [cite_start]Tooltips are available by hovering over most input fields[cite: 11].

**A. [cite_start]Experiment Parameters Card** [cite: 12]
[cite_start]This section defines the physical setup of your microreactor system and general experimental conditions[cite: 13].
* [cite_start]**Reactor Volume VR (uL):** The internal volume of the microreactor itself[cite: 14, 17]. [cite_start]This is crucial for calculating residence times and total flow rates[cite: 17]. [cite_start]Default: 500[cite: 19].
* **Concentration of Sample A / B (mM):** The stock concentration of Sample A and Sample B[cite: 21, 24, 28, 31]. Default: 100[cite: 26, 33].
* [cite_start]**Dead Volume Mixer to Reactor V1 (uL):** The volume of tubing/components between the mixing point and the microreactor inlet[cite: 35, 38]. [cite_start]After Step 1, this volume contains the trailing portion of the pumped mixture[cite: 39]. [cite_start]Default: 62[cite: 41].
* [cite_start]**Dead Volume Reactor to Collector V2 (uL):** The volume between the reactor outlet and the fraction collector[cite: 43, 46]. [cite_start]The reactant slug must transit this volume before being collected[cite: 47]. [cite_start]Default: 500[cite: 49].
* **Collect Volume per Fraction (uL):** Target volume collected in each individual fraction tube[cite: 51, 54]. Default: 100[cite: 56].
* [cite_start]**Total Reactant Mixture Pumped (Slug Volume) (uL):** Total volume of the formulated A+B+C_mixed solution actively pumped during Step 1[cite: 58, 61]. [cite_start]This entire volume is intended to pass through the reactor for the defined residence time[cite: 62]. [cite_start]Default: 500[cite: 64].
* **Diffusion Coefficient (Cd):** A dimensionless factor representing the fraction of the Slug Volume to collect as additional shoulders (before and after) to account for axial dispersion/diffusion[cite: 66, 69]. Target collection = SlugVolume_Input * (1 + 2 * Cd)[cite: 70]. Default: 0.1[cite: 71].
* [cite_start]**Post-Collection Flush Time (min):** Duration to flush the system with pure Solvent C after collection[cite: 73, 76]. [cite_start]Default: 5[cite: 78].
* **Max Syringe Volume Pump A / B (uL):** Maximum usable volume of the respective syringes[cite: 80, 83, 87, 90]. Default: 10000[cite: 85, 92].
* [cite_start]**Refill Pause Duration (min):** Time allocated for manual syringe refills if needed[cite: 94, 97]. [cite_start]Default: 1440[cite: 99].

**B. [cite_start]Pump Assignments Card** [cite: 101]
[cite_start]Assigns physical pumps to fluid streams[cite: 102].
* [cite_start]**Sample A:** Default PS3[cite: 103].
* [cite_start]**Sample B:** Default PS4[cite: 104].
* [cite_start]**Solvent C (Push/Flush):** Default Kn1[cite: 105].

**C. [cite_start]Experiment Design Setup Card** [cite: 106]
[cite_start]Defines the factor ranges for the chosen experimental design[cite: 107]:
* [cite_start]Min/Max Reactor Residence Time (min) [cite: 119]
* Min/Max Molar Ratio B/A [cite: 120]
* [cite_start]Min/Max Active Flow Fraction (A+B) [cite: 121]
* [cite_start]Min/Max Temperature (C) [cite: 124]

### II. [cite_start]Core Calculations & Logic [cite: 125]

**A. [cite_start]Per Experiment Setup** [cite: 127]
* **Total System Flow Rate (Q_total):** The constant volumetric flow rate for all dynamic operations[cite: 129, 130]. [cite_start]Q_total = VR / RT_current[cite: 131].
* [cite_start]**Flow Rates for Slug Formation (Step 1):** Q_{A+B} = Q_total * AFF_current, and Q_{C_mixed} = Q_total * (1 - AFF_current)[cite: 133, 134, 135]. To formulate the required mixture from stock solutions A and B, the volumetric flow depends on the target molar ratio R_target: Q_A = Q_{active} / (1 + R_target * ([A] / [B])), and Q_B = Q_{active} - Q_A.
* **Concentrations in Formulated Mixture:** C_{A,formulated} = (Q_A * C_{A_stock}) / (Q_A + Q_B + Q_{C_mixed})[cite: 137, 139].
* **Slug Volume for Reaction:** Set directly from the input. This entire volume passes through the reactor and is the basis for collection calculations[cite: 141, 142, 143].

**B. [cite_start]Syringe Refill Logic** [cite: 144]
[cite_start]Calculates the total volume of Sample A and Sample B needed to form the slug[cite: 145]. [cite_start]If the volume needed exceeds the remaining syringe volume, a refill is triggered, and a pause step is inserted at the beginning of that experiment[cite: 146, 147].

**C. [cite_start]Experimental Step Sequence** [cite: 148]
1.  **Refill Pause (Optional):** Duration based on user input[cite: 149].
2.  **Step 1: Form Reactant Slug:** Pumps A, B, and C_mixed dispense the slug volume at Q_total[cite: 150, 151]. At the end of Step 1, the V1 dead volume contains the trailing portion of the mixture, while the leading portion has entered the reactor VR[cite: 154, 155]. Warnings are triggered if the reactor is too small to hold the slug or if the slug is entirely trapped in V1[cite: 156, 157, 158].
3.  **Step 2: Push Slug with Solvent C, React, Collect, Flush:** Pure Solvent C (pumpC) pushes the slug at Q_total[cite: 162, 163]. Includes complete slug loading, reaction transit time, transit through V2, and fraction collection based on target volume[cite: 165, 167, 168, 169, 170]. Finally, the system undergoes a post-collection flush[cite: 172].

### III. Experimental Design (DoE) Mathematics & Statistics [cite: 199]

Design of Experiments (DoE) efficiently explores the experimental space[cite: 200, 201]. The planner supports multiple statistical designs:

| Feature | Full Factorial (2-level) | Box-Behnken (3-level) | Central Composite (Standard / Simple) |
| :--- | :--- | :--- | :--- |
| **Primary Use** | Screening, Main/Interaction Effects [cite: 236] | Optimization, Quadratic Modeling [cite: 236] | Optimization, Quadratic Modeling [cite: 236] |
| **Number of Factors** | Any [cite: 236] | 3 (in this planner) [cite: 236] | >= 2 (in this planner) [cite: 236] |
| **Levels per Factor** | 2 [cite: 236] | 3 [cite: 236] | 5 (Standard) or 3 (Simple) [cite: 236] |
| **Number of Runs** | 2^k [cite: 236] | 13 (for k=3) [cite: 236] | 2^k + 2k + 1 [cite: 236] |
| **Strengths** | Estimates all interactions, simple [cite: 236] | Economical, avoids extreme limits [cite: 236] | Highly flexible, estimates quadratic terms [cite: 236] |
| **Weaknesses** | Inefficient for many factors [cite: 236] | Limited to k>=3 [cite: 236] | Complex, can probe outside limits [cite: 236] |

* [cite_start]**Full Factorial (2-level):** Tests every possible combination using Min/Max values (2^k runs)[cite: 203, 204, 205].
* **Box-Behnken Design (BBD):** A 3-level response surface methodology design. [cite_start]Requires exactly 3 varying factors and tests minimum (-1), center (0), and maximum (+1) levels (13 runs)[cite: 210, 213, 214, 215].
* **Central Composite Design (CCD):** Builds on a factorial design by adding "axial/star" points and a center point to fit quadratic models[cite: 220, 221].
    * [cite_start]**Standard CCD (Rotatable):** alpha = (2^k)^0.25 to achieve uniform prediction variance[cite: 227, 228].
    * [cite_start]**Simple CCD (Face-centered):** alpha = 1, ensuring all tested levels remain strictly within the user-defined boundaries[cite: 231, 232, 233].

### IV. [cite_start]Output JSON Structure [cite: 174]
[cite_start]The heavily structured `.json` output file is an array of experiment objects containing[cite: 175]:
* `experiment_name`: Identifier for the experiment[cite: 176].
* [cite_start]`input_parameters`: Selected design type, volumes, concentrations, flush time, and targeted factor ranges[cite: 177, 178, 179, 180, 181, 182].
* `pump_assignments`: Pump names for A, B, C[cite: 183].
* [cite_start]`calculated_parameters`: Specific target levels, system flow rates, actual concentrations in the formulated mixture, volumes pumped, target collection volumes, and total duration[cite: 184, 185, 186, 187, 188, 189, 190, 192].
* `relevant_data`: Target temperature, start time for collection, and the first fraction tube index[cite: 193, 194, 195, 196].
* [cite_start]`experiment_steps`: A detailed instruction array for physical pumps, and `warnings_specific_to_this_experiment`[cite: 197, 198].

### [cite_start]V. Notes & Tips [cite: 237]
* [cite_start]The "Total Reactant Mixture Pumped (Slug Volume)" is the key volume that defines your scientific experiment in terms of what passes through the reactor[cite: 238].
* V1 influences the initial distribution of the slug but not the total volume of A, B, and C_mixed reported as "pumped in Step 1"[cite: 239].
* [cite_start]Pay close attention to warnings regarding slug size relative to V1 and VR, as they indicate if the physical assumptions of the model are met[cite: 240].
* [cite_start]The residence time RT_current is defined as VR / Q_total, representing the time for one reactor volume to be displaced[cite: 241].

---

## 2: Experiment Data Analyzer (`analysis_MCS_13.html`)

The Data Analyzer ingests the JSON file generated by the Planner. After executing the physical experiments, we input the measured Yield and Selectivity directly into this tool to model the response surfaces and predict mathematical optimums.

### Features
* **Adaptive Modeling:** Automatically detects the underlying DoE matrix type (2-level vs 3+ level) and adjusts its mathematical regression to prevent matrix singularity.
* **Dual-Objective Optimization:** Allows users to set weight percentages for Yield vs. Selectivity to calculate a customized "Weighted Score" for each experiment.
* **2D Contour Visualization:** Generates color-mapped topographical representations of interacting factor pairs.
* **Printable Reports:** Built-in CSS `@media print` rules format the page into a clean, presentation-ready PDF report.

### Mathematical Methods

#### Ordinary Least Squares (OLS) Regression
The tool utilizes matrix algebra to fit a Response Surface Model (RSM) over the experimental data. 

Let X be the design matrix of inputs and Y be the matrix of measured responses. The coefficients matrix B is found using the normal equation:
B = (X^T X)^-1 X^T Y

* **Matrix Inversion:** The inverse (X^T X)^-1 is calculated manually using **Gauss-Jordan elimination**.
* **Adaptive Terms:** * If the data contains at least 3 distinct levels for the interacting factors, a **Full Quadratic Model** is built (6 terms): 
        Response = b_0 + b_1*x + b_2*y + b_3*xy + b_4*x^2 + b_5*y^2
    * If the data contains only 2 levels (e.g., from a Full Factorial plan), the squared terms (x^2, y^2) cannot be computed due to zero degrees of freedom for curvature. The model automatically downgrades to a **Linear Interaction Model** (4 terms):
        Response = b_0 + b_1*x + b_2*y + b_3*xy

#### Optimum Prediction via Grid Search
To find the predicted theoretical maximum for the contour plots, the tool runs a high-resolution grid search. It divides the bounded area into a 30x30 grid (900 discrete evaluation points) and calculates the predicted Z value (Response) at each (x,y) coordinate using the derived beta coefficients. The maximum derived value is capped at 100% (for Yield/Selectivity logic) and plotted on the canvas as a star (★).

### Usage
1.  Open the file in a modern browser.
2.  Drag and drop the JSON file generated by the Planner into the upload zone.
3.  Fill in the measured Yield and Selectivity results in the generated table. *You can type decimals with a comma or dot.*
4.  If enough variance is detected (>= 4 distinct points for linear planes, >= 6 points for curves), the 2D contour plots and predicted optimums will automatically render.