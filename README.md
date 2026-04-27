# Narnia Labs AI Benchmark Leaderboard

**A non-commercial research benchmark for evaluating and ranking AI models in manufacturing and engineering domains.**

Developed by [Narnia Labs](https://www.narnia.ai/), this leaderboard provides transparent, standardized performance benchmarks to objectively assess AI models across 2D image generation and 3D geometry tasks.

> **Live Dashboard:** [http://leaderboard.narnia.ai/](http://leaderboard.narnia.ai/)

---

## About

The Narnia Labs AI Benchmark Leaderboard is an open, non-commercial research platform designed to objectively evaluate generative and predictive AI models. Models are assessed on standardized datasets derived from real-world manufacturing and engineering applications, and ranked using a composite scoring methodology that balances output quality, distributional fidelity, and resource efficiency.

This benchmark is intended solely for academic and research evaluation purposes.

## Benchmark Domains

| Domain | Task | Description |
|--------|------|-------------|
| **2D Image Generation** | Generation | Evaluates generative models on engineering image synthesis tasks |
| **3D Geometry Generation** | Generation | Evaluates models that generate 3D point cloud geometries for engineering components |
| **3D Geometry Evaluation** | Evaluation | Evaluates predictive models that estimate engineering performance on 3D geometries |

## Evaluated Models

| Domain | Models |
|--------|--------|
| **2D Generation** | GAN, VAE, DCGAN, LSGAN, WGAN-CP, WGAN-GP, R1GAN, DDPM, VQVAE |
| **3D Generation** | 3D-GAN, DeepSDF, PointFlow, ShapeGF, AtlasNet, Diffusion3D |
| **3D Evaluation** | Transolver++, AB-UPT, Transolver, PointNet, RegDGCNN, GeoFNO |

All models are benchmarked across four dataset sizes to assess data efficiency and scalability:
- **2D Generation:** S (50), M (100), L (200), XL (500)
- **3D Generation / Evaluation:** S (20), M (50), L (100), XL (200)

## Evaluation Metrics

| Domain | Metrics |
|--------|---------|
| **2D Generation** | IS, FID, LPIPS, PSNR, MS-SSIM, Precision, Density, Recall, Coverage, Train Time, Infer Time |
| **3D Generation** | MV-FID, FPD, CD, EMD, F-Score, MS-SSIM, Precision, Recall, Density, Coverage, Train Time, Infer Time |
| **3D Evaluation** | MAE, RMSE, MAPE, R², Rel-L2, MaxAE, MAC, Train Time, Infer Time |

Models are ranked using **BenchRank**, a graph-based ranking system combining Spearman correlation with debiased PageRank scoring for robust multi-metric evaluation.

## Benchmark Pipeline

All models follow a standardized 3-step pipeline to ensure fair comparison:

| Step | Name | Description |
|------|------|-------------|
| **A** | Train & Infer | Train each model under identical conditions (same dataset, scale, epochs) with early stopping, then generate 500 standardized samples from the best checkpoint |
| **B** | Calc Metrics | Compare 500 generated vs 500 real samples across quality, diversity, and efficiency metrics with ↑/↓ direction indicators |
| **C** | Rank Models | Debias correlated metrics → build head-to-head dominance graph → PageRank scoring → one Total Score per model |

Rankings are generated per dataset size (S/M/L/XL), with a switchable quality-only and quality+efficiency view.

## Features

- **Leaderboard Rankings** — Ranked model tables with multi-metric evaluation and visual heatmaps across dataset sizes (S/M/L/XL)
- **Interactive 3D Viewer** — Explore generated and predicted 3D point cloud geometries directly in the browser
- **Synchronized Dual 3D Viewer** — Side-by-side 3D comparison with camera-synced rotation and navigation
- **Inference Explorer** — Compare model outputs side-by-side with detailed per-model analysis
- **Scalability Analysis** — Benchmarks across multiple training-set sizes to assess data efficiency
- **Cross-Page Navigation** — Leaderboard model labels link directly to corresponding Inference Explorer detail views
- **URL State Persistence** — Filter selections preserved across page refresh and shareable via URL
- **Responsive Design** — Mobile-friendly layout with adaptive navigation

## Pages

| Page | Description |
|------|-------------|
| **Overview** | Statement, purpose, mission & KPI, benchmark pipeline, domain status, roadmap, and ultimate goal |
| **Leaderboard** | Interactive model rankings with filtering by dimension, task, and dataset size |
| **Inference Explorer** | Side-by-side model comparison with synchronized 3D viewers and generated image galleries |

## Datasets & Attribution

This benchmark utilizes the following research datasets. All datasets are used strictly within the terms of their respective licenses for non-commercial research purposes.

| Dataset | Source | License |
|---------|--------|---------|
| **DrivAerNet** | [Mohamedelrefaie/DrivAerNet](https://github.com/Mohamedelrefaie/DrivAerNet) | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| **DrivAerNet++** | [Mohamedelrefaie/DrivAerNet](https://github.com/Mohamedelrefaie/DrivAerNet) | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| **DeepJEB** | [KAIST-LENSE/DeepJEB](https://github.com/KAIST-LENSE/DeepJEB) | KAIST (proprietary) |

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
