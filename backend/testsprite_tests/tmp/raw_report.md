
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** backend
- **Date:** 2026-05-30
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 post api auth login with valid credentials
- **Test Code:** [TC001_post_api_auth_login_with_valid_credentials.py](./TC001_post_api_auth_login_with_valid_credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/0684c838-82db-4e07-a7df-a97b304355f1/bf2967de-619a-46b1-ba8e-b6d7b236e9e9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post api auth login with invalid credentials
- **Test Code:** [TC002_post_api_auth_login_with_invalid_credentials.py](./TC002_post_api_auth_login_with_invalid_credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/0684c838-82db-4e07-a7df-a97b304355f1/1ab8f2a3-711d-4293-bfae-e27caa0c9795
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 post api analysis save with valid payload
- **Test Code:** [TC003_post_api_analysis_save_with_valid_payload.py](./TC003_post_api_analysis_save_with_valid_payload.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 43, in test_post_api_analysis_save_with_valid_payload
AssertionError: Expected 200, got 404

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 47, in <module>
  File "<string>", line 45, in test_post_api_analysis_save_with_valid_payload
Exception: Analysis save step failed: Expected 200, got 404

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/0684c838-82db-4e07-a7df-a97b304355f1/888d9a34-654d-4e39-8fca-163d0c779158
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 get api analysis my reports
- **Test Code:** [TC004_get_api_analysis_my_reports.py](./TC004_get_api_analysis_my_reports.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/0684c838-82db-4e07-a7df-a97b304355f1/3e650fb3-ad73-4455-914b-136d8698459a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 get api competitor track
- **Test Code:** [TC005_get_api_competitor_track.py](./TC005_get_api_competitor_track.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/0684c838-82db-4e07-a7df-a97b304355f1/b57e7fd4-957d-4efc-9802-7dec5987d74a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **80.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---