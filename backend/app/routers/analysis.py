# app/routers/analysis.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
import logging
import uuid
from app.services.supabase_service import supabase_service
from app.routers.auth import get_current_user

logger = logging.getLogger("sellora.analysis")

router = APIRouter()

class AnalysisInputSchema(BaseModel):
    productName: str
    category: str
    sellingPrice: float
    costPrice: float
    platforms: List[str]
    description: str
    competitorUrl: Optional[str] = None
    reportLanguage: str = "en"

class SaveAnalysisSchema(BaseModel):
    input: AnalysisInputSchema
    overallScore: int
    status: str
    startedAt: str
    completedAt: Optional[str] = None
    pricing: Dict[str, Any]
    seo: Dict[str, Any]
    adCopies: Dict[str, Any]
    marketIntel: Dict[str, Any]
    financials: Dict[str, Any]
    recommendations: List[Dict[str, Any]]

@router.post("/save")
async def save_analysis(payload: SaveAnalysisSchema, current_user: dict = Depends(get_current_user)):
    try:
        client = supabase_service.get_client()
        analysis_uuid = str(uuid.uuid4())
        
        # 1. Insert into analyses table
        res_analysis = client.table("analyses").insert({
            "id": analysis_uuid,
            "user_id": current_user["id"],
            "product_name": payload.input.productName,
            "category": payload.input.category,
            "selling_price": payload.input.sellingPrice,
            "cost_price": payload.input.costPrice,
            "platforms": payload.input.platforms,
            "description": payload.input.description,
            "competitor_url": payload.input.competitorUrl,
            "status": payload.status,
            "overall_score": payload.overallScore,
            "report_language": payload.input.reportLanguage,
            "started_at": payload.startedAt,
            "completed_at": payload.completedAt or datetime.utcnow().isoformat()
        }).execute()
        
        if not res_analysis.data:
            raise HTTPException(status_code=500, detail="Failed to persist analysis record.")
            
        # 2. Insert into report_sections table
        sections = [
            {"section_name": "pricing", "content": payload.pricing},
            {"section_name": "seo", "content": payload.seo},
            {"section_name": "adcopies", "content": payload.adCopies},
            {"section_name": "marketintel", "content": payload.marketIntel},
            {"section_name": "financials", "content": payload.financials},
            {"section_name": "recommendations", "content": {"items": payload.recommendations}}
        ]
        
        for section in sections:
            client.table("report_sections").insert({
                "analysis_id": analysis_uuid,
                "section_name": section["section_name"],
                "content_en": section["content"],
                "content_ur": section["content"]  # using english/same content currently
            }).execute()
            
        return {"status": "success", "id": analysis_uuid}
    except Exception as e:
        logger.error(f"Save analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Database persistence failure: {e}")

@router.get("/my-reports")
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    try:
        client = supabase_service.get_client()
        
        # Fetch analyses
        res_analyses = client.table("analyses").select("*").eq("user_id", current_user["id"]).order("started_at", desc=True).execute()
        if not res_analyses.data:
            return []
            
        reports = []
        for analysis in res_analyses.data:
            analysis_id = analysis["id"]
            
            # Fetch report sections
            res_sections = client.table("report_sections").select("*").eq("analysis_id", analysis_id).execute()
            section_map = {}
            for section in res_sections.data:
                section_map[section["section_name"]] = section["content_en"]
                
            # Reconstruct recommendations list
            recs_data = section_map.get("recommendations", {})
            recommendations_list = recs_data.get("items", []) if isinstance(recs_data, dict) else recs_data
            
            reports.append({
                "id": analysis_id,
                "input": {
                    "productName": analysis.get("product_name"),
                    "category": analysis.get("category"),
                    "sellingPrice": float(analysis.get("selling_price") or 0),
                    "costPrice": float(analysis.get("cost_price") or 0),
                    "platforms": analysis.get("platforms") or [],
                    "description": analysis.get("description") or "",
                    "competitorUrl": analysis.get("competitor_url"),
                    "reportLanguage": analysis.get("report_language", "en")
                },
                "overallScore": analysis.get("overall_score") or 85,
                "status": analysis.get("status") or "completed",
                "startedAt": analysis.get("started_at"),
                "completedAt": analysis.get("completed_at"),
                "pricing": section_map.get("pricing") or {},
                "seo": section_map.get("seo") or {},
                "adCopies": section_map.get("adcopies") or {},
                "marketIntel": section_map.get("marketintel") or {},
                "financials": section_map.get("financials") or {},
                "recommendations": recommendations_list or []
            })
            
        return reports
    except Exception as e:
        logger.error(f"Get reports error: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    try:
        client = supabase_service.get_client()
        
        # Verify ownership first
        existing = client.table("analyses").select("id").eq("id", analysis_id).eq("user_id", current_user["id"]).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Analysis report not found or unauthorized.")
            
        res = client.table("analyses").delete().eq("id", analysis_id).execute()
        return {"status": "success", "message": "Report deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete report error: {e}")
        raise HTTPException(status_code=500, detail=f"Database deletion failure: {e}")

