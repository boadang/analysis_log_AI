import { useState } from "react";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

const riskColor = {
  critical: "destructive",
  high: "destructive",
  medium: "warning",
  low: "secondary",
  none: "outline",
};

const riskIcon = {
  critical: <AlertTriangle className="w-4 h-4" />,
  high: <AlertTriangle className="w-4 h-4" />,
  medium: <ShieldAlert className="w-4 h-4" />,
  low: <ShieldCheck className="w-4 h-4" />,
  none: <ShieldCheck className="w-4 h-4" />,
};

export default function ThreatTimeline({ timeline = [] }) {
  const [selected, setSelected] = useState(null);

  const safeTimeLine = timeline || [];

  if (!safeTimeLine.length) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No threat events detected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      {/* Timeline list */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-lg font-semibold mb-2">Threat Timeline</h3>
          {safeTimeLine.map((event, idx) => (
            <div
              key={idx}
              className={`border rounded-2xl p-3 cursor-pointer transition hover:shadow ${
                selected === idx ? "bg-muted" : ""
              }`}
              onClick={() => setSelected(idx)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {riskIcon[event.risk_level]}
                  <span className="text-sm font-medium">
                    {event.summary}
                  </span>
                </div>
                <Badge variant={riskColor[event.risk_level] || "outline"}>
                  {event.risk_level?.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {event.timestamp} • {event.threat_type}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detail panel */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2">Threat Detail</h3>
          {selected === null ? (
            <p className="text-sm text-muted-foreground">
              Select a threat event to view details
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={riskColor[safeTimeLine[selected].risk_level] || "outline"}>
                  {safeTimeLine[selected].risk_level?.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">
                  {safeTimeLine[selected].threat_type}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                {safeTimeLine[selected].timestamp}
              </div>

              <div>
                <p className="text-sm font-semibold">AI Summary</p>
                <p className="text-sm">
                  {safeTimeLine[selected].summary}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold m-2">Raw Log</p>
                <pre className="text-xs bg-black text-green-400 p-3 rounded-xl overflow-auto max-h-60">
                  {safeTimeLine[selected].raw_log}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
