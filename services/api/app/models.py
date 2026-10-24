import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

def uid(): return str(uuid.uuid4())
def now(): return datetime.now(timezone.utc)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

class Scholar(TimestampMixin, Base):
    __tablename__ = "scholars"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    name_id: Mapped[str] = mapped_column(String, index=True)
    name_ar: Mapped[str] = mapped_column(String, default="")
    birth_year_h: Mapped[str] = mapped_column(String, nullable=True)
    death_year_h: Mapped[str] = mapped_column(String, nullable=True)
    death_year_m: Mapped[str] = mapped_column(String, nullable=True)
    bio_id: Mapped[str] = mapped_column(Text, default="")

class Work(TimestampMixin, Base):
    __tablename__ = "works"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    scholar_id: Mapped[str] = mapped_column(ForeignKey("scholars.id"), nullable=True, index=True)
    title_id: Mapped[str] = mapped_column(String, default="")
    title_ar: Mapped[str] = mapped_column(String, default="")
    description: Mapped[str] = mapped_column(Text, default="")

class Source(TimestampMixin, Base):
    __tablename__ = "sources"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)
    registry_id: Mapped[str] = mapped_column(ForeignKey("source_registry.id"), nullable=True)
    url: Mapped[str] = mapped_column(String, default="")
    title: Mapped[str] = mapped_column(String, default="")
    content_format: Mapped[str] = mapped_column(String, default="TEXT")  # TEXT/AUDIO
    status: Mapped[str] = mapped_column(String, default="DISCOVERED")
    notes: Mapped[str] = mapped_column(Text, default="")

class SourceRegistry(TimestampMixin, Base):
    __tablename__ = "source_registry"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String, index=True)
    domain: Mapped[str] = mapped_column(String, default="")
    scholar_id: Mapped[str] = mapped_column(ForeignKey("scholars.id"), nullable=True, index=True)
    content_type: Mapped[str] = mapped_column(String, default="")
    access_method: Mapped[str] = mapped_column(String, default="WEB")
    permission_status: Mapped[str] = mapped_column(String, default="UNVERIFIED")
    redistribution_policy: Mapped[str] = mapped_column(String, default="UNKNOWN")
    crawl_limits: Mapped[str] = mapped_column(String, nullable=True)
    last_checked: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    connector_status: Mapped[str] = mapped_column(String, default="UNKNOWN")

class SourceEdition(TimestampMixin, Base):
    __tablename__ = "source_editions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), nullable=True, index=True)
    edition: Mapped[str] = mapped_column(String, default="")
    publisher: Mapped[str] = mapped_column(String, default="")
    year: Mapped[str] = mapped_column(String, nullable=True)

class SourceAsset(TimestampMixin, Base):
    __tablename__ = "source_assets"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), nullable=True, index=True)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)
    url: Mapped[str] = mapped_column(String, default="")
    checksum: Mapped[str] = mapped_column(String, index=True, default="")
    mime_type: Mapped[str] = mapped_column(String, default="")
    raw_text: Mapped[str] = mapped_column(Text, default="")

class Material(TimestampMixin, Base):
    __tablename__ = "materials"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    scholar_id: Mapped[str] = mapped_column(ForeignKey("scholars.id"), nullable=True, index=True)
    title_id: Mapped[str] = mapped_column(String, default="")
    title_ar: Mapped[str] = mapped_column(String, default="")
    content_type: Mapped[str] = mapped_column(String, default="FATWA")  # FATWA/BOOK/AUDIO
    status: Mapped[str] = mapped_column(String, default="DISCOVERED", index=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    rights_status: Mapped[str] = mapped_column(String, default="UNKNOWN")
    source_url: Mapped[str] = mapped_column(String, nullable=True)
    ai_label: Mapped[str] = mapped_column(Text, nullable=True)

class MaterialVersion(TimestampMixin, Base):
    __tablename__ = "material_versions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str] = mapped_column(Text, default="")

class ArabicText(TimestampMixin, Base):
    __tablename__ = "arabic_texts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    full_text: Mapped[str] = mapped_column(Text, default="")
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)

class TextSegment(TimestampMixin, Base):
    __tablename__ = "text_segments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    arabic_text_id: Mapped[str] = mapped_column(ForeignKey("arabic_texts.id"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    text_ar: Mapped[str] = mapped_column(Text, default="")

class Translation(TimestampMixin, Base):
    __tablename__ = "translations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    model: Mapped[str] = mapped_column(String, default="")
    prompt_version: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="DRAFT")
    ai_run_id: Mapped[str] = mapped_column(ForeignKey("ai_runs.id"), nullable=True)

class TranslationSegment(TimestampMixin, Base):
    __tablename__ = "translation_segments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    translation_id: Mapped[str] = mapped_column(ForeignKey("translations.id"), index=True)
    text_segment_id: Mapped[str] = mapped_column(ForeignKey("text_segments.id"), index=True)
    text_id: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[int] = mapped_column(Integer, default=1)

class Topic(TimestampMixin, Base):
    __tablename__ = "topics"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    name_id: Mapped[str] = mapped_column(String, default="")
    name_ar: Mapped[str] = mapped_column(String, default="")
    parent_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), nullable=True)
    description_id: Mapped[str] = mapped_column(Text, default="")

class MaterialTopic(Base):
    __tablename__ = "material_topics"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)

class Issue(TimestampMixin, Base):
    __tablename__ = "issues"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    title_id: Mapped[str] = mapped_column(String, default="")
    description_id: Mapped[str] = mapped_column(Text, default="")
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), nullable=True, index=True)

class IssueMaterial(Base):
    __tablename__ = "issue_materials"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    issue_id: Mapped[str] = mapped_column(ForeignKey("issues.id"), index=True)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)

class QuranVerse(TimestampMixin, Base):
    __tablename__ = "quran_verses"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    surah_id: Mapped[int] = mapped_column(Integer, index=True, default=0)
    surah_name_ar: Mapped[str] = mapped_column(String, default="")
    surah_name_id: Mapped[str] = mapped_column(String, default="")
    ayah_number: Mapped[int] = mapped_column(Integer, default=0)
    text_ar: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String, default="")
    edition: Mapped[str] = mapped_column(String, default="")
    validation_status: Mapped[str] = mapped_column(String, default="UNVERIFIED")

class QuranTranslation(TimestampMixin, Base):
    __tablename__ = "quran_translations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    verse_id: Mapped[str] = mapped_column(ForeignKey("quran_verses.id"), index=True)
    text_id: Mapped[str] = mapped_column(Text, default="")
    translator: Mapped[str] = mapped_column(String, default="")

class HadithRecord(TimestampMixin, Base):
    __tablename__ = "hadith_records"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    matan_ar: Mapped[str] = mapped_column(Text, default="")
    translation_id_text: Mapped[str] = mapped_column(Text, default="")
    narrator: Mapped[str] = mapped_column(String, default="")
    collection: Mapped[str] = mapped_column(String, default="")
    book: Mapped[str] = mapped_column(String, default="")
    chapter: Mapped[str] = mapped_column(String, default="")
    hadith_number: Mapped[str] = mapped_column(String, default="")
    numbering_scheme: Mapped[str] = mapped_column(String, default="")
    reference_url: Mapped[str] = mapped_column(String, default="")
    match_status: Mapped[str] = mapped_column(String, default="UNVERIFIED")

class HadithNarration(TimestampMixin, Base):
    __tablename__ = "hadith_narrations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    hadith_id: Mapped[str] = mapped_column(ForeignKey("hadith_records.id"), index=True)
    narrator: Mapped[str] = mapped_column(String, default="")
    chain_text: Mapped[str] = mapped_column(Text, default="")

class HadithGrading(TimestampMixin, Base):
    __tablename__ = "hadith_gradings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    hadith_id: Mapped[str] = mapped_column(ForeignKey("hadith_records.id"), index=True)
    grader: Mapped[str] = mapped_column(String, default="")
    grade: Mapped[str] = mapped_column(String, default="")
    notes: Mapped[str] = mapped_column(Text, default="")

class EvidenceMention(TimestampMixin, Base):
    __tablename__ = "evidence_mentions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    mention_text: Mapped[str] = mapped_column(Text, default="")
    evidence_type: Mapped[str] = mapped_column(String, default="")
    is_displayed_as_fact: Mapped[bool] = mapped_column(Boolean, default=False)

class Citation(TimestampMixin, Base):
    __tablename__ = "citations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    text: Mapped[str] = mapped_column(Text, default="")
    evidence: Mapped[str] = mapped_column(Text, nullable=True)
    is_displayed_as_fact: Mapped[bool] = mapped_column(Boolean, default=False)

class ReferenceMatch(TimestampMixin, Base):
    __tablename__ = "reference_matches"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    matched_text: Mapped[str] = mapped_column(Text, default="")
    reference_type: Mapped[str] = mapped_column(String, default="")  # QURAN/HADITH
    status: Mapped[str] = mapped_column(String, default="CANDIDATE")
    evidence: Mapped[str] = mapped_column(Text, nullable=True)
    is_displayed_as_fact: Mapped[bool] = mapped_column(Boolean, default=False)

class AcquisitionJob(TimestampMixin, Base):
    __tablename__ = "acquisition_jobs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    url: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="PENDING")
    error: Mapped[str] = mapped_column(Text, nullable=True)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True)
    registry_id: Mapped[str] = mapped_column(String, nullable=True)

class ProcessingJob(TimestampMixin, Base):
    __tablename__ = "processing_jobs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)
    job_type: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="PENDING")
    error: Mapped[str] = mapped_column(Text, nullable=True)
    detail: Mapped[str] = mapped_column(Text, default="")

class AIRun(TimestampMixin, Base):
    __tablename__ = "ai_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)
    model: Mapped[str] = mapped_column(String, default="")
    prompt_version: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="RUNNING")
    error: Mapped[str] = mapped_column(Text, nullable=True)
    cost_estimate: Mapped[float] = mapped_column(Float, default=0)
    tokens_input: Mapped[int] = mapped_column(Integer, default=0)
    tokens_output: Mapped[int] = mapped_column(Integer, default=0)

class GlossaryTerm(TimestampMixin, Base):
    __tablename__ = "glossary_terms"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    term_ar: Mapped[str] = mapped_column(String, default="")
    term_id: Mapped[str] = mapped_column(String, default="")
    context: Mapped[str] = mapped_column(Text, default="")

class QualityFinding(TimestampMixin, Base):
    __tablename__ = "quality_findings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    ai_run_id: Mapped[str] = mapped_column(ForeignKey("ai_runs.id"), nullable=True)
    rule: Mapped[str] = mapped_column(String, default="")
    severity: Mapped[str] = mapped_column(String, default="LOW")  # LOW/MEDIUM/HIGH/CRITICAL
    message: Mapped[str] = mapped_column(Text, default="")
    segment_ref: Mapped[str] = mapped_column(String, nullable=True)

class PublicationApproval(TimestampMixin, Base):
    __tablename__ = "publication_approvals"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    admin_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=True)
    decision: Mapped[str] = mapped_column(String, default="")  # APPROVED/REJECTED
    notes: Mapped[str] = mapped_column(Text, default="")
    content_hash: Mapped[str] = mapped_column(String(64), default="", server_default="")

class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String, default="")
    entity: Mapped[str] = mapped_column(String, default="")
    entity_id: Mapped[str] = mapped_column(String, nullable=True)
    detail: Mapped[str] = mapped_column(Text, default="")

class Role(TimestampMixin, Base):
    __tablename__ = "roles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)

class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, default="")
    full_name: Mapped[str] = mapped_column(String, default="")
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    mfa_secret: Mapped[str] = mapped_column(String, nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    role = relationship("Role")

class ScholarAlias(TimestampMixin, Base):
    __tablename__ = "scholar_aliases"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    scholar_id: Mapped[str] = mapped_column(ForeignKey("scholars.id"), index=True)
    alias: Mapped[str] = mapped_column(String, default="")
    lang: Mapped[str] = mapped_column(String, default="ar")

class UserNote(TimestampMixin, Base):
    __tablename__ = "user_notes"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    text_segment_id: Mapped[str] = mapped_column(String, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")

class CorrectionReport(TimestampMixin, Base):
    __tablename__ = "correction_reports"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    text_segment_id: Mapped[str] = mapped_column(String, nullable=True)
    reporter_name: Mapped[str] = mapped_column(String, default="")
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="PENDING", index=True)

class Bookmark(TimestampMixin, Base):
    __tablename__ = "bookmarks"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)

class ReadingHistory(TimestampMixin, Base):
    __tablename__ = "reading_history"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)

class MaterialSearch(Base):
    """Rebuildable search projection; original text is always retained separately."""
    __tablename__ = "material_search"
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), primary_key=True)
    normalized_text: Mapped[str] = mapped_column(Text, default="")

class ContentTask(TimestampMixin, Base):
    __tablename__ = "content_tasks"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    dedup_key: Mapped[str] = mapped_column(String(64), unique=True)
    kind: Mapped[str] = mapped_column(String)  # IMPORT / TRANSLATE
    url: Mapped[str] = mapped_column(String, default="")
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True)
    registry_id: Mapped[str] = mapped_column(ForeignKey("source_registry.id"), nullable=True)
    scholar_id: Mapped[str] = mapped_column(ForeignKey("scholars.id"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING", index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)
    error: Mapped[str] = mapped_column(Text, default="")

class QualityReview(TimestampMixin, Base):
    __tablename__ = "quality_reviews"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), index=True)
    content_hash: Mapped[str] = mapped_column(String(64))
    rule: Mapped[str] = mapped_column(String)
    segment_ref: Mapped[str] = mapped_column(String, default="")
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    notes: Mapped[str] = mapped_column(Text)

class CorpusCandidate(TimestampMixin, Base):
    """A discovered source is not a published material or a completed translation."""
    __tablename__ = "corpus_candidates"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    source_key: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    scholar_key: Mapped[str] = mapped_column(String(30), index=True)
    canonical_url: Mapped[str] = mapped_column(Text)
    title_ar: Mapped[str] = mapped_column(Text, default="")
    title_origin: Mapped[str] = mapped_column(String, default="URL_SLUG")
    discovery_url: Mapped[str] = mapped_column(Text)
    discovery_method: Mapped[str] = mapped_column(String)
    topic_hint: Mapped[str] = mapped_column(String, default="")
    topic_basis: Mapped[str] = mapped_column(String, default="UNCLASSIFIED")
    scope: Mapped[str] = mapped_column(String, default="UNCLASSIFIED", index=True)
    page_status: Mapped[str] = mapped_column(String, default="DISCOVERED", index=True)
    body_status: Mapped[str] = mapped_column(String, default="NOT_CHECKED")
    ingestion_status: Mapped[str] = mapped_column(String, default="METADATA_ONLY", index=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    content_checksum: Mapped[str] = mapped_column(String(64), default="")
    source_reference: Mapped[str] = mapped_column(Text, default="")
    text_ar: Mapped[str] = mapped_column(Text, default="")
    rights_evidence: Mapped[str] = mapped_column(Text, default="")
    error: Mapped[str] = mapped_column(Text, default="")
    material_id: Mapped[str] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)


class CorpusTarget(TimestampMixin, Base):
    __tablename__ = "corpus_targets"
    scholar_key: Mapped[str] = mapped_column(String(30), primary_key=True)
    target: Mapped[int] = mapped_column(Integer, default=100)
    paused: Mapped[bool] = mapped_column(Boolean, default=True)
