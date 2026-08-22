"""
AEGIS Feature Engineering & Preprocessing Pipeline
Defines scikit-learn ColumnTransformer for encoding, scaling, and feature extraction.
Supports easy serialization, standalone inference, and downstream API serving.
"""

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml.src.config import (
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    BINARY_FEATURES,
)


def build_preprocessor() -> ColumnTransformer:
    """
    Constructs a ColumnTransformer that:
    - Scales continuous numeric features (BMI)
    - One-hot encodes categorical features with robust handling of unseen categories
    - Passes through binary health condition indicator flags
    """
    numeric_transformer = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
            ("bin", "passthrough", BINARY_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    return preprocessor
