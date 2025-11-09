```markdown
Conversion CI notes — Dynamic World -> TFJS (for EAGLE Lens)

What this workflow does
- Runs on GitHub Actions (ubuntu-latest).
- Clones google/dynamicworld, converts forward/backward SavedModel folders (defaults: model/forward and model/backward) to TFJS format via tensorflowjs_converter.
- Places converted artifacts under server/models/dynamicworld/forward and /backward.
- Optionally commits converted files back to your repo (danger: large files).
- Alternatively uploads converted folders as workflow artifacts for manual download.

How to use
1. Add the files above to your repository and commit to a branch.
2. On GitHub, go to Actions -> Convert Dynamic World SavedModels -> Run workflow.
3. Provide inputs:
   - commit_changes: 'true' to commit converted files back (beware repo size), otherwise 'false' (recommended).
   - forward_savedmodel_path/backward_savedmodel_path: usually 'model/forward' and 'model/backward' (relative to the cloned dynamicworld repo).
4. Wait — conversion may take many minutes and need >8GB RAM on the runner.

Important warnings & recommendations
- Model sizes can be large (hundreds of MBs to GBs). Committing them to your repo may blow up git. Recommended approach:
  - Use the workflow with `commit_changes: false` and download the artifact from the run.
  - Store converted artifacts in a release or object storage (S3/GCS) rather than the git repo.
- If tensorflowjs_converter complains about unsupported ops:
  - Consider serving the SavedModel with TensorFlow Serving instead of converting to TFJS.
  - Alternatively try a SavedModel wrapper or use --skip_op_check (risky).
- The workflow installs tensorflow-cpu to avoid GPU driver issues; GPU conversion may be faster but requires a different runner.
- Preprocessing to match model signatures is essential. See dynamicworld/single_image_runner.ipynb in the google/dynamicworld repo for precise band ordering and normalization.

If you want me to:
- Change the workflow to upload converted TFJS artifacts to an S3/GCS bucket (I can add steps — you'll need to provide credentials as secrets).
- Or change to a no-commit flow that only stores artifacts and posts a comment with download links (requires further Actions steps).
- Or implement a release-creation step that attaches converted models to a GitHub release (recommended instead of committing large binaries).
Tell me which and I'll provide the updated workflow.
```