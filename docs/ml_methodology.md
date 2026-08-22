# AEGIS Machine Learning Methodology & Risk Engine Architecture

## 1. Executive Summary & Problem Formulation
AEGIS is an AI-native autonomous parametric insurance protocol. The machine learning subsystem operates as the **AI Risk Engine**, predicting an applicant's probability of experiencing significant physical health impairment based on demographic, biometric, socioeconomic, and chronic health indicators.

- **Primary Dataset**: 2024 CDC Behavioral Risk Factor Surveillance System (BRFSS), comprising 457,670 raw survey records and 301 variables.
- **Target Variable**: `_PHYS14D` (Computed 3-level physical health status over the past 30 days).
- **Binary Classification Formulation**:
  - **Class 0 (Lower Risk)**: `_PHYS14D = 1` (0 days impaired) or `2` (1–13 days impaired) $\rightarrow$ 85.71% of valid respondents.
  - **Class 1 (Higher Risk)**: `_PHYS14D = 3` (14–30 days impaired / frequent physical distress) $\rightarrow$ 14.29% of valid respondents.
  - **Excluded**: `_PHYS14D = 9` (Refused / Don't know / Missing).

---

## 2. Anti-Leakage Audit & Feature Selection
To preserve scientific validity and prevent artificial inflation of accuracy, all direct measures and derived proxies of the target were audited and strictly excluded.

### Excluded Leakage Variables
| Variable | Description | Rationale for Exclusion |
| :--- | :--- | :--- |
| `_PHYS14D` | Computed physical health status (14+ days) | Target variable itself. |
| `PHYSHLTH` | Raw continuous days physical health not good | Direct input from which `_PHYS14D` is calculated. |
| `POORHLTH` | Days physical/mental health prevented activity | Conditioned directly on non-zero `PHYSHLTH`. |
| `_RFHLTH` | Adults with good or better health | Derived directly from `GENHLTH`. |
| `GENHLTH` | General health rating (1=Excellent ... 5=Poor) | Subjective summary proxy for health status. |

### Verified Candidate Features (2024 CDC BRFSS Codebook)
| Category | Variable Name | CDC 2024 Codebook Meaning | Standardized Field |
| :--- | :--- | :--- | :--- |
| **Demographics** | `_AGE_G` | 6-level imputed age categories (18-24 to 65+) | `age_group` |
| | `SEXVAR` | Sex of respondent (1=Male, 2=Female) | `sex` |
| | `EDUCA` | Highest grade completed (1–6) | `education_level` |
| | `INCOME3` | Annual household income (1–11) | `income_level` |
| **Biometrics & Lifestyle** | `_BMI5` | Body Mass Index (continuous, implied 2 decimals) | `bmi` (continuous kg/m²) |
| | `_SMOKER3` | 4-level smoking status | `smoking_status` |
| | `EXERANY2` | Physical activity in past 30 days (1=Yes, 2=No) | `physical_activity` (0/1) |
| **Cardiovascular** | `CVDINFR4` | Ever told had heart attack (1=Yes, 2=No) | `heart_attack` (0/1) |
| | `CVDCRHD4` | Ever told had angina/CAD (1=Yes, 2=No) | `coronary_disease` (0/1) |
| | Derived | `CVDINFR4 == 1` or `CVDCRHD4 == 1` | `heart_disease_composite` (0/1) |
| | `CVDSTRK3` | Ever told had stroke (1=Yes, 2=No) | `stroke` (0/1) |
| **Metabolic & Organ** | `DIABETE4` | Diagnosed diabetes (1=Yes, 2-4=No/Other) | `diabetes` (0/1) |
| | `CHCKDNY2` | Ever told had kidney disease (1=Yes, 2=No) | `kidney_disease` (0/1) |
| | `HAVARTH4` | Ever told had arthritis/gout/lupus (1=Yes, 2=No) | `arthritis` (0/1) |
| | `CHCCOPD3` | Ever told had COPD/emphysema (1=Yes, 2=No) | `copd` (0/1) |
| | `ASTHMA3` | Ever told had asthma (1=Yes, 2=No) | `asthma` (0/1) |
| **Healthcare Access** | `PRIMINS2` | Primary source of insurance (1–10, 88=None) | `insurance_type` |
| | `PERSDOC3` | Personal doctor (1=Yes one, 2=Multiple, 3=No) | `personal_doctor` |
| | `MEDCOST1` | Could not afford doctor in past 12m (1=Yes, 2=No)| `medical_cost_barrier` (0/1) |

---

## 3. Dataset Preprocessing & Stratification
- **Raw Sample**: 457,670 records
- **Valid Cleaned Sample**: 446,603 records (97.58% retention)
- **Data Splits**:
  - **Train Set (70%)**: 312,621 rows
  - **Validation Set (15%)**: 66,991 rows
  - **Test Set (15%)**: 66,991 rows (held-out for unbiased benchmarking)

---

## 4. Model Evaluation & Probability Calibration Benchmark

Evaluating models solely on accuracy is misleading for imbalanced medical insurance risk modeling (85.7% class 0 vs 14.3% class 1). We evaluated discrimination (**ROC-AUC**, **PR-AUC**) alongside calibration (**Brier Score Loss**).

### Held-out Test Set Benchmark Comparison Table
| Model | ROC-AUC | PR-AUC | Brier Score | F1 Score | Recall | Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **LightGBM (Calibrated Sigmoid)** | **0.7952** | **0.4378** | **0.1004** | 0.2938 | 0.1934 | **86.71%** |
| **LightGBM (Calibrated Isotonic)** | 0.7948 | 0.4288 | 0.1005 | 0.3018 | 0.2004 | 86.75% |
| **XGBoost (Calibrated Sigmoid)** | 0.7949 | 0.4365 | 0.1008 | 0.2895 | 0.1895 | 86.71% |
| **XGBoost (Calibrated Isotonic)** | 0.7946 | 0.4271 | 0.1005 | 0.2920 | 0.1922 | 86.68% |
| **XGBoost (Uncalibrated, weighted)** | 0.7949 | 0.4365 | 0.1801 | **0.4379** | 0.7004 | 74.30% |
| **LightGBM (Uncalibrated, weighted)**| 0.7952 | 0.4378 | 0.1804 | 0.4372 | **0.7068** | 73.99% |
| **Random Forest (Balanced)** | 0.7900 | 0.4247 | 0.1809 | 0.4353 | 0.6842 | 74.63% |
| **Logistic Regression (Balanced)** | 0.7901 | 0.4275 | 0.1830 | 0.4340 | 0.6939 | 74.13% |

### Key Observations
1. **Calibration Halves Expected Loss Error**: The uncalibrated models outputted probabilities shifted toward higher values due to inverse class frequency weighting ($scale\_pos\_weight = 6.0$). While effective for threshold-based recall ($Rec \approx 70.7\%$), raw scores had a high Brier score ($0.1804$). Post-calibration (Platt Sigmoid / Isotonic), the Brier score plummeted by **44.3%** down to **0.1004**, matching true empirical event probabilities.
2. **Superior Discrimination**: Both LightGBM and XGBoost outperform Random Forest and Logistic Regression in PR-AUC (0.4378 vs 0.4275) and ROC-AUC (0.7952 vs 0.7901).
3. **Selected Final Model**: `LightGBM (Calibrated Sigmoid)` is selected as the primary production model for the AEGIS AI Risk Engine, achieving optimal calibration (Brier: 0.1004) and top discrimination (ROC-AUC: 0.7952).

---

## 5. Scientifically Defensible Confidence Metric
Confidence is calculated dynamically based on distance from the classification decision boundary (0.50) modulated by baseline empirical test reliability:

$$\text{Certainty} = 2 \times |P_{\text{calibrated}} - 0.5|$$
$$\text{Confidence} = \text{clip}\left(\text{BaseReliability} + \text{Certainty} \times (\text{MaxReliability} - \text{BaseReliability}) \times \text{Completeness},\ 0.70,\ 0.99\right)$$

Where:
- $\text{BaseReliability} = 0.82$ (representing the model's baseline test reliability)
- $\text{MaxReliability} = 0.985$

---

## 6. Model Explainability & SHAP Insights
Feature attribution analysis using TreeSHAP on test cohorts revealed the top risk drivers:
1. **Cardiovascular Disease & Stroke History** (+ largest positive risk multiplier)
2. **COPD / Chronic Respiratory Illness** (+ high risk multiplier)
3. **Diagnosed Diabetes & Chronic Kidney Disease** (+ strong chronic morbidity impact)
4. **Arthritis / Joint Disorders** (+ high physical mobility impairment impact)
5. **Elevated BMI ($\ge 30.0$) and Active Smoking** (+ compounding lifestyle risk)
6. **Physical Activity** (- key protective factor lowering risk probability)
