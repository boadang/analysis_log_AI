from typing import Dict

def _build_analysis_text(
    total_logs: int,
    detected_threats: int,
    risk_distribution: Dict[str, int],
    aggregated_stats: Dict
) -> str:
    return f"""
=== AI Analysis Report ===

Total Logs Analyzed: {total_logs}
Threats Detected: {detected_threats} ({aggregated_stats.get('threat_percentage')}%)

Risk Distribution:
- Critical: {risk_distribution['critical']}
- High: {risk_distribution['high']}
- Medium: {risk_distribution['medium']}
- Low: {risk_distribution['low']}
- None: {risk_distribution['none']}

Threat Types:
{chr(10).join(f"- {k}: {v}" for k, v in aggregated_stats.get('threat_types', {}).items())}

Average Confidence: {aggregated_stats.get('average_confidence')}
"""