# DrishtiRakshak AI — Month 1 Scaffold

This is the working Month 1 codebase from the 6-month pilot roadmap. It is
scoped deliberately small. Read the three-tier distinction below before
describing this project to anyone — overclaiming what's built is the
fastest way to lose credibility with a real pilot partner or interviewer.

## Current Implementation (what actually exists, verified working)

- Django project with 4 apps: `organizations`, `vehicles`, `evidence`, `incidents`
- A separate `detection` package with a **stable interface boundary**
  (`detection/interface.py`) so the rest of the app never talks to
  ultralytics/opencv directly — only `detection/service.py` does.
- `detection/service.py`: YOLOv8n wrapper, samples every 10th frame. Falls
  back to a no-op stub if `ultralytics` isn't installed, so the pipeline is
  always testable without the heavy CV dependency.
- `detection/risk.py`: a **fully transparent rule** — 2+ vehicle detections
  present for 5+ consecutive sampled frames = a "sustained proximity" event.
  This is a heuristic proxy for "something is loitering nearby," not a
  learned behavioral model. Every risk score traces back to specific
  detections you can verify by hand.
- `detection/pipeline.py`: ties detection + risk scoring to the DB — creates
  `TimelineEvent`s and an `Incident`, then locks the `Evidence` (computes
  and stores a sha256 hash, marks it immutable at the application level).
- Verified end-to-end: creating an `Organization` → `Vehicle` → uploading
  `Evidence` → running `process_evidence()` → produces a locked, hashed
  evidence record and an `Incident` with a human-readable summary. Tested
  with a synthetic clip in stub-detector mode (see "Known limitations").
- Django admin is wired up for all models — usable as a working demo UI
  before any custom frontend exists.

## Important honesty note on "evidence locking"

`Evidence.lock()` computes a sha256 hash and marks the record immutable at
the application level. This demonstrates the *pattern* of tamper-evidence
(the hash would change if the file were altered). **It is not a legally
admissible chain-of-custody system.** Do not describe it as one to a pilot
partner, in a pitch, or in an interview without that caveat.

## Known limitations right now

- `ultralytics` is not installed in this environment (large download,
  ~200MB+ with torch). The detection service runs in stub mode (returns no
  detections) until you `pip install ultralytics` and test against a real
  dashcam clip with actual vehicles/people in it.
- Object tracking isn't implemented yet — "sustained proximity" currently
  counts vehicle-class detections per sampled frame, not the *same* tracked
  vehicle across frames. This is a known, documented approximation (see
  comments in `risk.py`), not an oversight — tracking is a Month 2 item.
- No auth/permissions layer yet — single-org, single-developer use only.
- No API endpoints yet (Month 1 uses Django admin as the interim UI).
- No frontend yet.

## Planned (Month 2+, per the 6-month roadmap)

- ByteTrack object tracking for accurate sustained-proximity detection
- OCR for license plates
- React timeline UI
- First real outreach conversations with fleet operators running in parallel

## Future Vision (not implemented, not scheduled — do not present as built)

- Multi-agent orchestration, n8n workflows, Qdrant semantic memory,
  Kubernetes, legally admissible evidence chain-of-custody, multi-vehicle
  correlation, emergency service integration.
- These remain long-term direction only. They get built if and when a real
  pilot's usage data justifies the complexity — not before.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then visit `/admin/` to create an Organization, Vehicle, and upload Evidence.

To run the detection pipeline on an uploaded Evidence object:

```python
# python manage.py shell
from evidence.models import Evidence
from detection.pipeline import process_evidence

ev = Evidence.objects.get(id="...")
incident = process_evidence(ev)
print(incident.summary)
```

To enable real detection instead of stub mode:

```bash
pip install ultralytics
```

(First run will auto-download the `yolov8n.pt` checkpoint.)
