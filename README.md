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
---

## 2: Experiment Data Analyzer (`analysis_MCS.html`)

The Data Analyzer ingests the JSON file generated by the Planner or mnaully edited by the user. After executing the physical experiments, measured Yield and Selectivity values are entered directly into this tool, which then fits response surface models, computes model diagnostics, and predicts mathematical optimums.

### Features

- **Adaptive Modeling:** Automatically detects the underlying DoE matrix type (2-level vs. 3+ level) and selects between a linear+interaction model and a full quadratic RSM, preventing matrix singularity.
- **Dual-Objective Optimization:** Allows users to set weight percentages for Yield vs. Selectivity via sliders to compute a normalized "Weighted Score" (ranging from 0 to 1) for each experiment run.
- **2D Contour Visualization:** Generates color-mapped heatmaps of interacting factor pairs, with a star marker at the predicted optimum.
- **Printable Reports:** Built-in CSS `@media print` rules hide interactive controls and format the page as a clean, presentation-ready PDF.

---

### Mathematical Methods

#### Factor Coding

All factors are linearly rescaled to coded units in $[-1, +1]$ before any matrix operation, using:

$$x_c = \frac{2(x - x_{\min})}{x_{\max} - x_{\min}} - 1$$

This centering ensures numerical stability during matrix inversion. The model statistics table, however, displays coefficients converted back to **actual physical units** for direct interpretability.

#### Weighted Score

For each experiment, the composite score is computed as:

$$\text{score} = w_Y \cdot \frac{\text{Yield}}{100} + w_S \cdot \frac{\text{Selectivity}}{100}$$

where $w_Y$ and $w_S$ are the slider-defined importance weights (summing to 1). This normalized score $\in [0, 1]$ is used as the response vector for the "Weighted Score" RSM model.

#### Design Matrix and Model Terms

The code automatically selects the model structure based on the number of distinct levels in the data:

- **Linear + Interaction model** (2-level designs, `isOptimDesign = false`): terms are Intercept, each factor $x_i$, and all pairwise interactions $x_i x_j$.
- **Full Quadratic RSM** (3+ level designs, `isOptimDesign = true`): adds quadratic terms $x_i^2$ for each factor on top of the linear and interaction terms.

The total number of model terms $p$ is checked against the number of data points $n$; the model is aborted if $n < p$.

#### Ordinary Least Squares (OLS) Regression

The coefficient vector $\mathbf{B}$ is solved via the normal equation:

$$\mathbf{B} = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{y}$$

Matrix inversion uses Gauss–Jordan elimination with partial pivoting. If a pivot smaller than $10^{-12}$ is encountered, the matrix is declared singular and the model returns null.

---

### Statistical Parameters Displayed

All of the following parameters are computed inside `buildModelWithStats()` and rendered by `renderModelStatsTable()`.

#### Coefficient Table (per model term)

The statistics table has one row per model term (Intercept, linear, quadratic, interaction). Each row contains:

| Column | Symbol | Formula | Meaning |
|---|---|---|---|
| **Coefficient** | $b_i$ | $(\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$ | The OLS regression coefficient in **actual physical units**. |
| **Std. Error** | $\text{SE}(b_i)$ | $\sqrt{MS_{res} \cdot [(\mathbf{X}^T\mathbf{X})^{-1}]_{ii}}$ | The estimated standard deviation of the coefficient, derived from the diagonal of the scaled inverse information matrix. |
| **95% CI Lower** | $b_i - 1.96 \cdot \text{SE}(b_i)$ | — | Lower bound of the 95% confidence interval, using $t = 1.96$ (large-sample normal approximation). |
| **95% CI Upper** | $b_i + 1.96 \cdot \text{SE}(b_i)$ | — | Upper bound of the 95% confidence interval. |

Rows where the 95% CI **does not cross zero** (i.e., `ciLow > 0` OR `ciHigh < 0`) are rendered in **bold**, indicating the term is statistically significant at the 5% level.

**Interpreting coefficients in actual units:**

- **Intercept ($b_0$):** The model's predicted response when all factors are simultaneously at zero in physical units. Since zero may lie outside the experimental domain, this is a mathematical anchor of the regression plane rather than an experimentally achievable condition.
- **Linear coefficients ($b_i$):** The expected change in the response for a +1 actual unit increase in factor $i$ (e.g., +1 °C or +1 min), with all other factors held at zero.
- **Quadratic coefficients ($b_{ii}$):** The curvature of the response surface per squared actual unit. A significant negative value indicates a local maximum (peak); a positive value indicates a local minimum (valley).
- **Interaction coefficients ($b_{ij}$):** How the effect of factor $i$ changes per +1 actual unit increase in factor $j$, capturing synergistic or antagonistic factor relationships.

---

#### Summary Statistics Table

| Label | Symbol | Formula | Interpretation |
|---|---|---|---|
| **Std. Dev.** | $\sigma$ | $\sqrt{MS_{res}} = \sqrt{\frac{SS_{res}}{n-p}}$ | The residual standard deviation — the average scatter of observed responses around the fitted model surface. Lower is better. |
| **Mean** | $\bar{y}$ | $\frac{1}{n}\sum y_i$ | The arithmetic mean of all entered response values. Used as the denominator in C.V. |
| **C.V. %** | C.V. | $\frac{\sigma}{|\bar{y}|} \times 100$ | Coefficient of Variation — expresses the residual standard deviation as a percentage of the mean response. Measures the relative noise level of the model. Values below ~10% are generally considered acceptable. |
| **PRESS** | PRESS | $\sum_{i=1}^{n} \left(\frac{e_i}{1 - h_{ii}}\right)^2$ | Predicted Residual Error Sum of Squares. Each residual is divided by $(1 - h_{ii})$, where $h_{ii}$ is the $i$-th diagonal of the hat matrix $\mathbf{H} = \mathbf{X}(\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T$, giving leave-one-out cross-validation error without re-fitting. Smaller PRESS indicates better predictive capability. |
| **R-Squared** | $R^2$ | $1 - \frac{SS_{res}}{SS_{tot}}$ | Proportion of total response variance explained by the model. Goal: $> 0.9$. |
| **Adj R-Squared** | $R^2_{adj}$ | $1 - \frac{SS_{res}/(n-p)}{SS_{tot}/(n-1)}$ | Adjusts $R^2$ for the number of terms $p$ relative to experiments $n$, penalizing unnecessary model complexity. Adding insignificant terms will decrease this even if $R^2$ stays flat or rises. |
| **Pred R-Squared** | $R^2_{pred}$ | $1 - \frac{\text{PRESS}}{SS_{tot}}$ | Indicates how well the model predicts responses for new, unseen experiments. A gap larger than 0.2 between $R^2_{adj}$ and $R^2_{pred}$ warns of potential overfitting or outliers. |
| **Adeq. Precision** | A.P. | $\frac{\hat{y}_{max} - \hat{y}_{min}}{\sqrt{p \cdot MS_{res}/n}}$ | Adequate Precision — a signal-to-noise ratio comparing the range of fitted values to average prediction uncertainty. A value **> 4** is required to consider the model usable for navigating the design space. |

---

### Optimization Methods

#### 2D Grid Search (Contour Plots)

For each pair of factors, the 2-factor model is evaluated on a 50 × 50 grid (2,601 points) across the bounded factor space. This renders the heatmap canvas and places the star marker at the local maximum found on the grid.

#### Global N-Factor Random Walk

To find the "Global RSM Optimum" across all factors simultaneously, the tool uses a two-stage approach operating entirely in coded space $[-1, 1]^k$:

1. **Coarse grid seed:** A grid of $\max(4,\ \lfloor 400^{1/k} \rfloor)$ points per dimension is evaluated to find a starting point $\mathbf{x}^*$.
2. **Random-walk refinement:** 2,000 iterations are performed. At each step, a random perturbation of size $\pm \text{step}$ is applied in each dimension. If the new point improves the prediction, it replaces the current best. The step size is halved every 200 iterations (shrinking from 0.5 to ~0.002), progressively narrowing the search to pinpoint the mathematical peak.

For Yield and Selectivity responses, the predicted optimum value is capped to $[0, 100]$ for display, though the uncapped mathematical value is also retained internally.

---

### Usage

1. Open the file in a modern browser.
2. Drag and drop the JSON file generated by the Planner into the upload zone, or click **Manual Setup** to enter factor values directly.
3. Fill in the measured Yield and Selectivity results in the generated table. Decimals may be entered with either a comma or a dot.
4. If sufficient data variance is detected (≥ 4 distinct points for linear models, ≥ 6 for quadratic models), the 2D contour plots, predicted optimums, and full model statistics will render automatically.

---

*Updated 9 April 2026 — Version 14 — NitaD & MCS Univ Paris-Saclay*



