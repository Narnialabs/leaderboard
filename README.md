# Narnia Labs Engineering AI Leaderboard

**A non-commercial research benchmark for evaluating and ranking AI models in manufacturing and engineering domains.**

Developed by [Narnia Labs](https://www.narnia.ai/), this leaderboard provides transparent, standardized performance benchmarks to objectively assess AI models across seven engineering tasks: 3D geometry generation, 3D field prediction, 3D scalar prediction, 2D image generation, 2D field prediction, 2D scalar prediction, and 1D scalar prediction.

> **Live Dashboard:** [http://leaderboard.narnia.ai/](http://leaderboard.narnia.ai/)

---

## About

PhysicsBench, the benchmark behind this leaderboard, is an open, non-commercial research platform designed to objectively evaluate generative and predictive AI models. Models are assessed on standardized datasets derived from real-world manufacturing and engineering applications, and ranked using a composite scoring methodology that balances output quality, distributional fidelity, and resource efficiency.

This benchmark is intended solely for academic and research evaluation purposes.

## Benchmark Domains

| Domain | Task | Description |
|--------|------|-------------|
| **3D Geometry Generation** | Generation | Evaluates generative models that produce 3D point cloud geometries for engineering components |
| **3D Field Prediction** | Prediction (point cloud → field) | Per-point engineering fields — displacement, stress & mode shapes (DeepJEB), automotive aero surface/center-plane fields (DrivAerNet), and surface + volume CFD fields (DrivAerML) |
| **3D Scalar Prediction** | Prediction (point cloud → scalar) | Global engineering scalars from 3D geometries — mass & modal frequencies (DeepWheel), peak stress & displacement (DeepJEB) |
| **2D Image Generation** | Generation | Evaluates generative models on engineering image synthesis tasks |
| **2D Field Prediction** | Prediction (image → image) | Per-pixel engineering fields from images — z-buffer depth (DeepWheel), FEA stress & displacement (DeepJEB), steady Darcy pressure (PDEBench), and RANS flow (AirfRANS) |
| **2D Scalar Prediction** | Prediction (image → scalar) | Global engineering scalars from rendered views — mass & modal frequencies (DeepWheel), peak stress & displacement (DeepJEB) |
| **1D Scalar Prediction** | Prediction (tabular / timeseries → scalar) | Tabular regression (UCI Concrete, Airfoil Self-Noise) and turbofan remaining-useful-life from timeseries (NASA C-MAPSS) |

## Evaluated Models

| Domain | Models |
|--------|--------|
| **3D Geometry Generation** | 3D-GAN, DeepSDF, PointFlow, ShapeGF, AtlasNet, Diffusion3D |
| **3D Field Prediction** | Transolver++, Transolver, LinearNO, LinearNO-Big, GeoFNO, GeoTransolver, GeoFLARE, DoMINO, PointNet, RegDGCNN |
| **3D Scalar Prediction** | PointNet, PointNet++, PointNet++ Lite, DGCNN, PCT, PCT-Small, Point Transformer, Point Transformer-Small, PointMLP, PointMLP-Elite |
| **2D Image Generation** | GAN, VAE, DCGAN, LSGAN, WGAN-CP, WGAN-GP, R1GAN, DDPM, VQVAE |
| **2D Field Prediction** | U-Net, ResNet-U-Net, Attention U-Net, U-Net++, SegFormer-B0, FPN-ResNet18, GLPN, DPT-Hybrid |
| **2D Scalar Prediction** | SimpleCNN, ResNet-18, ResNet-34, EfficientNet-B0, ConvNeXt-Tiny, DenseNet-121, ViT-Tiny |
| **1D Scalar Prediction** | MLP, FT-Transformer, NODE, TabNet, TabPFN, XGBoost, LightGBM, Random Forest, Gaussian Process, Ridge · *(timeseries)* LSTM, BiLSTM, DCNN, TCN, CNN-LSTM, DAST |

All models are benchmarked across four dataset sizes to assess data efficiency and scalability:
- **3D Geometry Generation:** S (20), M (50), L (100), XL (200)
- **2D Image Generation:** S (50), M (100), L (200), XL (500)
- **All Prediction tasks (1D / 2D / 3D, field & scalar):** S (20), M (50), L (100), XL (200)

## Evaluation Metrics

| Domain | Metrics |
|--------|---------|
| **3D Geometry Generation** | MV-FID, FPD, MMD-CD, COV-CD, 1-NNA-CD, MS-SSIM, Precision, Recall, Density, Coverage, Manifold-Δ, Uniformity-Δ, Train Time, Infer Time |
| **3D Field Prediction** | MAE, RMSE, MAPE, R², Rel-L2, MAC, Sign Agree, Extremal Agree, Train Time, Infer Time |
| **3D Scalar Prediction** | MAE, RMSE, MAPE, R², Rel-L2, MaxAE, Pearson, Spearman, Train Time, Infer Time |
| **2D Image Generation** | IS, FID, LPIPS, PSNR, MS-SSIM, Precision, Density, Recall, Coverage, Train Time, Infer Time |
| **2D Field Prediction** | MAE, RMSE, MAPE, R², Rel-L2, PSNR, SSIM (+ AbsRel, sqRel, δ<1.25 on the depth dataset only), Train Time, Infer Time |
| **2D Scalar Prediction** | MAE, RMSE, MAPE, R², Rel-L2, MaxAE, Pearson, Spearman, Train Time, Infer Time |
| **1D Scalar Prediction** | MAE, RMSE, MAPE, R², Rel-L2, MaxAE, Pearson, Spearman, Train Time, Infer Time |

Every metric a task lists is both **computed and ranked** — what the leaderboard shows is exactly what BenchRank ranks on, with no display-only "reference" columns. Two field-specific choices keep the ranking faithful to quality: **MaxAE is not computed for field tasks** (the single worst-pixel error rewards blurry, under-confident "mean" predictions, so it is anti-correlated with field quality — it stays a ranked metric for **scalar** tasks, where one error per sample makes it well-behaved), and the monocular-depth metrics (**AbsRel / sqRel / δ<1.25**) are computed only for the depth dataset, where they are meaningful. Everything else — MAPE included — is ranked wherever it is computed.

Models are ranked using **BenchRank**, a graph-based ranking system combining Spearman debiasing with PageRank over a head-to-head dominance graph, plus a viability gate that floors catastrophic-failure outliers and a geometric-mean cross-dataset aggregate.

## Benchmark Pipeline

All models follow a standardized 3-step pipeline to ensure fair comparison:

| Step | Name | Description |
|------|------|-------------|
| **A** | Train & Infer | Train each model under identical conditions (same dataset, scale, epochs) with early stopping, then generate up to 500 samples (capped at the test-split size) from the best checkpoint |
| **B** | Calc Metrics | Compare up to 500 generated vs 500 real samples (capped at the split size) across quality, diversity, and efficiency metrics with ↑/↓ direction indicators |
| **C** | Rank Models | Debias correlated metrics → build head-to-head dominance graph → PageRank scoring → one Total Score per model |

Rankings are generated per dataset size (S/M/L/XL), with a switchable quality-only and quality+efficiency view.

> All reported Train/Infer Time figures are standardized to the NVIDIA RTX PRO 6000 platform for cross-model comparability.

## Features

- **Leaderboard Rankings** — Ranked model tables with multi-metric evaluation and visual heatmaps across dataset sizes (S/M/L/XL)
- **Interactive 3D Viewer** — Explore generated and predicted 3D point cloud geometries directly in the browser, with a shared three-quarter camera elevation and one turbo colormap (legend-matched) across every 2D-field and 3D-field panel for a consistent engineering colour language
- **Synchronized Dual 3D Viewer** — Side-by-side 3D comparison with camera-synced rotation and navigation
- **Scalar Error Diagnostics** — Scalar/tabular tasks (no per-sample geometry) render predicted-vs-actual (1:1) scatters, signed-residual plots, error histograms, and MAE-by-ground-truth-band charts to show *where* across the value range a model is biased
- **Explorer** — Browse the full model inventory and drill into any model's detail view (performance metrics + interactive 3D viewer + per-sample gallery / error diagnostics, with a switcher for model · size · dataset · target)
- **Scalability Analysis** — Benchmarks across multiple training-set sizes to assess data efficiency
- **Cross-Page Navigation** — Benchmark model labels link directly to corresponding Explorer detail views
- **URL State Persistence** — Filter selections preserved across page refresh and shareable via URL
- **Responsive Design** — Mobile-friendly layout with adaptive navigation

## Pages

| Page | Description |
|------|-------------|
| **Overview** | Statement, purpose, mission & KPI, benchmark pipeline, domain status, roadmap, and ultimate goal |
| **Benchmark** | Interactive model rankings with a **Dataset → Target → Component → Axis** filter ladder (atop dimension / task / data size), per-task ranked tables, and per-sample visual results (2D fields with the turbo colormap; interactive 3D field point-cloud viewer; scalar/1D tasks as per-model predicted-vs-actual + residual scatters). Model labels link straight into the matching Explorer detail view |
| **Analysis** | Head-to-head Model A vs Model B comparison across Dataset · Data Size · Target axes — Trajectory, Qualitative, Mathematical, Frontier, Progression, Disagreement, and Distribution views |
| **Explorer** | Per-model browse — inventory strip, model card grid, and a detail view with performance metrics, interactive 3D viewer, and a per-sample gallery (field/generation tasks) or error-diagnostics dashboard (scalar/1D tasks); switcher for model · size · dataset · target |

## Datasets & Attribution

This benchmark utilizes the following research datasets. All datasets are used strictly within the terms of their respective licenses for non-commercial research purposes.

| Dataset | Source | License |
|---------|--------|---------|
| **DeepJEB** | [Narnia Labs](https://dataset.narnia.ai/) | [ODC-By v1.0](https://opendatacommons.org/licenses/by/1-0/) |
| **DeepWheel** | [Narnia Labs](https://dataset.narnia.ai/) | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| **DrivAerML** | [caemldatasets.org/drivaerml](https://caemldatasets.org/drivaerml/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **DrivAerNet / DrivAerNet++** | [Mohamedelrefaie/DrivAerNet](https://github.com/Mohamedelrefaie/DrivAerNet) | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| **AirfRANS** | [Bonnet et al., NeurIPS 2022](https://airfrans.readthedocs.io/) | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) |
| **PDEBench (Darcy)** | [pdebench/PDEBench, NeurIPS 2022](https://github.com/pdebench/PDEBench) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| **UCI Concrete / Airfoil Self-Noise** | [UCI ML Repository](https://archive.ics.uci.edu/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| **NASA C-MAPSS** | [NASA Prognostics Data Repository](https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/) | U.S. Gov — Public Domain |

> Mohamed Elrefaie, Angela Dai, Florian Padberg. *DrivAerNet++: A Large-Scale Multimodal Car Dataset with Computational Fluid Dynamics Simulations and Deep Learning Benchmarks.* NeurIPS 2024 Datasets and Benchmarks Track.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) — Data visualization
- [PapaParse](https://www.papaparse.com/) — CSV data loading
- [Three.js](https://threejs.org/) — 3D point cloud rendering

## About Narnia Labs

Narnia Labs is an AI technology company revolutionizing the product development process. Our no-code AI platform, **AslanX**, empowers manufacturers with generative and predictive AI capabilities — from design generation to performance evaluation and optimization.

Learn more at [narnia.ai](https://www.narnia.ai/).

## Contact

| Name | Role | Email | LinkedIn |
|------|------|-------|----------|
| **Simon Lee** (Sang Won Lee) | AI Research Engineer | simon.lee@narnia.ai | [korsangwonlee](https://www.linkedin.com/in/korsangwonlee/) |
| **Paul Jeong** (Hyogu Jeong) | AI Research Engineer | paul.jeong@narnia.ai | [pauljeong96](https://www.linkedin.com/in/pauljeong96/) |

## License

This project's **source code** is proprietary and owned by Narnia Labs.

The **datasets** used in this benchmark retain their original licenses as specified by their respective authors. Please refer to the [Datasets & Attribution](#datasets--attribution) section for details.

This benchmark is provided for non-commercial research and academic evaluation only.

Copyright (c) Narnia Labs. All rights reserved.
