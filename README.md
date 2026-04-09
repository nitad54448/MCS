# DOE for multipass

# Scherrmann Lab Microreactor DoE Suite

Welcome to the **Scherrmann Lab Microreactor DoE (Design of Experiments) Suite**. This repository contains two interconnected HTML/JavaScript applications designed to plan, execute, and analyze continuous-flow microreactor experiments. 

These tools operate entirely client-side in the browser, requiring no external server or backend.

---

## 1: Microreactor Experiment Planner (`plan_MCS_v13.html`)

The Experiment Planner generates highly specific, mathematically rigorous JSON experiment plans based on user-defined chemical and physical parameters. It calculates precise pump flow rates, slug tracking, collection times, and syringe refill schedules. The web interface includes a dynamic version number in its footer (e.g., Version: 20250606_094500) reflecting the date and time the script was loaded in your browser. This specific documentation aligns with Document Version 2025-06-26.

This JSON file is used in our lab in a specific system programmed in Labview.

### I. Input Parameters
The planner uses several input parameters, organized into cards on the user interface. Tooltips are available by hovering over most input fields.

**A. Experiment Parameters Card**
This section defines the physical setup of your microreactor system and general experimental conditions.
* **Reactor Volume VR (uL):** The internal volume of the microreactor itself. This is crucial for calculating residence times and total flow rates. Default: 500.
* **Concentration of Sample A / B (mM):** The stock concentration of Sample A and Sample B. Default: 100.
* **Dead Volume Mixer to Reactor V1 (uL):** The volume of tubing/components between the mixing point and the microreactor inlet. After Step 1, this volume contains the trailing portion of the pumped mixture. Default: 62.
* **Dead Volume Reactor to Collector V2 (uL):** The volume between the reactor outlet and the fraction collector. The reactant slug must transit this volume before being collected. Default: 500.
* **Collect Volume per Fraction (uL):** Target volume collected in each individual fraction tube. Default: 100.
* **Total Reactant Mixture Pumped (Slug Volume) (uL):** Total volume of the formulated A+B+C_mixed solution actively pumped during Step 1. This entire volume is intended to pass through the reactor for the defined residence time. Default: 500.
* **Diffusion Coefficient (Cd):** A dimensionless factor representing the fraction of the Slug Volume to collect as additional shoulders (before and after) to account for axial dispersion/diffusion. Target collection = SlugVolume_Input * (1 + 2 * Cd). Default: 0.1.
* **Post-Collection Flush Time (min):** Duration to flush the system with pure Solvent C after collection. Default: 5.
* **Max Syringe Volume Pump A / B (uL):** Maximum usable volume of the respective syringes. Default: 10000.
* **Refill Pause Duration (min):** Time allocated for manual syringe refills if needed. Default: 1440.

**B. Pump Assignments Card**
Assigns physical pumps to fluid streams.
* **Sample A:** Default PS3.
* **Sample B:** Default PS4.
* **Solvent C (Push/Flush):** Default Kn1.

**C. Experiment Design Setup Card**
Defines the factor ranges for the chosen experimental design:
* Min/Max Reactor Residence Time (min)
* Min/Max Molar Ratio B/A
* Min/Max Active Flow Fraction (A+B)
* Min/Max Temperature (C)

### II. Core Calculations & Logic

**A. Per Experiment Setup**
* **Total System Flow Rate (Q_total):** The constant volumetric flow rate for all dynamic operations. Q_total = VR / RT_current.
* **Flow Rates for Slug Formation (Step 1):** Q_{A+B} = Q_total * AFF_current, and Q_{C_mixed} = Q_total * (1 - AFF_current). To formulate the required mixture from stock solutions A and B, the volumetric flow depends on the target molar ratio R_target: Q_A = Q_{active} / (1 + R_target * ([A] / [B])), and Q_B = Q_{active} - Q_A.
* **Concentrations in Formulated Mixture:** C_{A,formulated} = (Q_A * C_{A_stock}) / (Q_A + Q_B + Q_{C_mixed}).
* **Slug Volume for Reaction:** Set directly from the input. This entire volume passes through the reactor and is the basis for collection calculations.

**B. Syringe Refill Logic**
Calculates the total volume of Sample A and Sample B needed to form the slug. If the volume needed exceeds the remaining syringe volume, a refill is triggered, and a pause step is inserted at the beginning of that experiment.

**C. Experimental Step Sequence**
1.  **Refill Pause (Optional):** Duration based on user input.
2.  **Step 1: Form Reactant Slug:** Pumps A, B, and C_mixed dispense the slug volume at Q_total. At the end of Step 1, the V1 dead volume contains the trailing portion of the mixture, while the leading portion has entered the reactor VR. Warnings are triggered if the reactor is too small to hold the slug or if the slug is entirely trapped in V1.
3.  **Step 2: Push Slug with Solvent C, React, Collect, Flush:** Pure Solvent C (pumpC) pushes the slug at Q_total. Includes complete slug loading, reaction transit time, transit through V2, and fraction collection based on target volume. Finally, the system undergoes a post-collection flush.

### III. Experimental Design (DoE) Mathematics & Statistics

Design of Experiments (DoE) efficiently explores the experimental space. The planner supports multiple statistical designs:

| Feature | Full Factorial (2-level) | Box-Behnken (3-level) | Central Composite (Standard / Simple) |
| :--- | :--- | :--- | :--- |
| **Primary Use** | Screening, Main/Interaction Effects | Optimization, Quadratic Modeling | Optimization, Quadratic Modeling |
| **Number of Factors** | Any | 3 (in this planner) | >= 2 (in this planner) |
| **Levels per Factor** | 2 | 3 | 5 (Standard) or 3 (Simple) |
| **Number of Runs** | 2^k | 13 (for k=3) | 2^k + 2k + 1 |
| **Strengths** | Estimates all interactions, simple | Economical, avoids extreme limits | Highly flexible, estimates quadratic terms |
| **Weaknesses** | Inefficient for many factors | Limited to k>=3 | Complex, can probe outside limits |

* **Full Factorial (2-level):** Tests every possible combination using Min/Max values (2^k runs).
* **Box-Behnken Design (BBD):** A 3-level response surface methodology design. Requires exactly 3 varying factors and tests minimum (-1), center (0), and maximum (+1) levels (13 runs).
* **Central Composite Design (CCD):** Builds on a factorial design by adding "axial/star" points and a center point to fit quadratic models.
    * **Standard CCD (Rotatable):** alpha = (2^k)^0.25 to achieve uniform prediction variance.
    * **Simple CCD (Face-centered):** alpha = 1, ensuring all tested levels remain strictly within the user-defined boundaries.

### IV. Output JSON Structure
The heavily structured `.json` output file is an array of experiment objects containing:
* `experiment_name`: Identifier for the experiment.
* `input_parameters`: Selected design type, volumes, concentrations, flush time, and targeted factor ranges.
* `pump_assignments`: Pump names for A, B, C.
* `calculated_parameters`: Specific target levels, system flow rates, actual concentrations in the formulated mixture, volumes pumped, target collection volumes, and total duration.
* `relevant_data`: Target temperature, start time for collection, and the first fraction tube index.
* `experiment_steps`: A detailed instruction array for physical pumps, and `warnings_specific_to_this_experiment`.

### V. Notes & Tips
* The "Total Reactant Mixture Pumped (Slug Volume)" is the key volume that defines your scientific experiment in terms of what passes through the reactor.
* V1 influences the initial distribution of the slug but not the total volume of A, B, and C_mixed reported as "pumped in Step 1".
* Pay close attention to warnings regarding slug size relative to V1 and VR, as they indicate if the physical assumptions of the model are met.
* The residence time RT_current is defined as VR / Q_total, representing the time for one reactor volume to be displaced.

---

## 2: Experiment Data Analyzer (`analysis_MCS.html`)

The Data Analyzer ingests the JSON file generated by the Planner. After executing the physical experiments, we input the measured Yield and Selectivity directly into this tool to model the response surfaces and predict mathematical optimums.

### Features
* **Adaptive Modeling:** Automatically detects the underlying DoE matrix type (2-level vs 3+ level) and adjusts its mathematical regression to prevent matrix singularity.
* **Dual-Objective Optimization:** Allows users to set weight percentages for Yield vs. Selectivity to calculate a customized "Weighted Score" for each experiment.
* **2D Contour Visualization:** Generates color-mapped topographical representations of interacting factor pairs.
* **Printable Reports:** Built-in CSS `@media print` rules format the page into a clean, presentation-ready PDF report.

### Mathematical Methods

### Mathematical Methods

#### Ordinary Least Squares (OLS) Regression & Statistics
The tool utilizes matrix algebra to fit a Response Surface Model (RSM) over the experimental data. Let **X** be the design matrix of inputs (coded to [-1, 1]) and **Y** be the matrix of measured responses. The coefficients matrix **B** is found using the normal equation:  
$$B = (X^T X)^{-1} X^T Y$$

#### Model Validation Parameters
To validate the reliability of the model, the following statistical parameters are calculated:
* **R-Squared ($R^2$):** Measures the proportion of variance explained by the model (Goal: > 0.9).
* **Adjusted $R^2$:** Adjusts the $R^2$ based on the number of terms ($p$) and experiments ($n$), ensuring that adding insignificant factors doesn't artificially inflate the score.
* **Predicted $R^2$:** Indicates how well the model predicts new data based on **PRESS** (Prediction Error Sum of Squares). A large gap between Adjusted and Predicted $R^2$ often indicates outliers or model over-fitting.
* **Adequate Precision:** Measures the "signal-to-noise ratio". A value greater than 4 is generally required to navigate the design space.
* **Coefficient 95% CI:** The tool calculates the 95% Confidence Interval using a t-value of 1.96. If the CI for a coefficient does not cross zero, that factor is considered **statistically significant**.


#### The Significance of Coded Units
Fitting the model in **coded units** (where factors range from -1 to +1) is a standard practice in DoE because it makes the coefficients comparable regardless of their original scale (e.g., comparing Temperature in °C to Time in minutes). This gives the model parameters specific physical meanings:

* **Intercept ($b_0$):** Represents the predicted response value at the **center point** of the experimental design (where all coded factors are 0).
* **Linear Coefficients ($b_i$):** Represent the change in response when a factor moves from the center to the edge of the design space (a 1-unit change in coded space). These directly indicate the "sensitivity" or importance of each factor.
* **Quadratic Coefficients ($b_{ii}$):** Indicate the **curvature** of the response surface. A significant negative coefficient suggests a "peak" (maximum), while a positive one suggests a "valley" (minimum).
* **Interaction Coefficients ($b_{ij}$):** Describe how the effect of one factor changes depending on the level of another factor (e.g., the effect of temperature is stronger at longer residence times).

#### Optimum Prediction: Grid Search & Random Walk
The tool employs a multi-stage approach to find the theoretical best conditions:

1.  **2D Grid Search (Visual):** For contour plots, the model evaluates a 50x50 grid (2,500 points) across the bounded area to render the heatmap and identify local peaks.
2.  **Global N-Factor Random Walk (Mathematical):** To find the "Global RSM Optimum" across all factors simultaneously, the tool uses a coarse grid to identify a starting point, followed by a **2,000-iteration random walk**. This refinement process uses shrinking step sizes to pinpoint the mathematical maximum with high precision, far exceeding the resolution of the visual 2D grid.


### Usage
1.  Open the file in a modern browser.
2.  Drag and drop the JSON file generated by the Planner into the upload zone.
3.  Fill in the measured Yield and Selectivity results in the generated table. *You can type decimals with a comma or dot.*
4.  If enough variance is detected (>= 4 distinct points for linear planes, >= 6 points for curves), the 2D contour plots and predicted optimums will automatically render.

   updated on 9th of april 2026, version 14
