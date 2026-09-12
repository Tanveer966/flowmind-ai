import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Droplets,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Waves,
  Clock3,
  Target,
  GitCompare,
  TrendingUp,
  BarChart3,
  BrainCircuit,
  ArrowUpRight,
  History,
  Trash2,
  ExternalLink,
  Layers3,
  MapPinned,
  Navigation,
  Building2,
  Route,
} from "lucide-react";

import "./flowmind-chic.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type ViewMode =
  | "simulation"
  | "scenarios"
  | "analytics"
  | "history";

type VisualizationMode = "depth" | "flow" | "arrival";
type MapLayer = "drainage" | "roads" | "infrastructure" | "riskZones";
type MapBase = "terrain" | "hydrology" | "response";

function App() {

  const [view, setView] =
    useState<ViewMode>("simulation");

  const [rainfall, setRainfall] =
    useState(180);

  const [drainageCapacity, setDrainageCapacity] =
    useState(45);

  const [initialWaterLevel, setInitialWaterLevel] =
    useState(20);

  const [duration, setDuration] =
    useState(60);

  const [simulation, setSimulation] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [loadingStage, setLoadingStage] =
    useState("");

  const [currentFrame, setCurrentFrame] =
    useState(0);

  const [playing, setPlaying] =
    useState(false);

  const [speed, setSpeed] =
    useState(1);

  const [visualizationMode, setVisualizationMode] =
    useState<VisualizationMode>("depth");

  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [mapDragOrigin, setMapDragOrigin] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const [mapLayers, setMapLayers] = useState<Record<MapLayer, boolean>>({
    drainage: true,
    roads: true,
    infrastructure: true,
    riskZones: true,
  });

  const [mapBase, setMapBase] = useState<MapBase>("terrain");

  const [showReport, setShowReport] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<{
    name: string;
    type: string;
    priority: number;
    arrival: number | null;
    depth: number;
    status: string;
  } | null>(null);

  const [scenarios, setScenarios] =
    useState<any[]>([]);

  const [scenarioLoading, setScenarioLoading] =
    useState(false);

  const [history, setHistory] =
    useState<any[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");


  /* =====================================================
     RUN SIMULATION
  ===================================================== */

  const runSimulation = async () => {

    try {

      setLoading(true);
      setLoadingStage("Initializing propagation model…");

      setPlaying(false);

      await new Promise((resolve) => setTimeout(resolve, 350));
      setLoadingStage("Computing runoff and terrain flow…");
      await new Promise((resolve) => setTimeout(resolve, 350));
      setLoadingStage("Propagating flood across elevation cells…");

      const response =
        await fetch(
          "http://localhost:5000/api/simulations",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              rainfall,
              drainageCapacity,
              initialWaterLevel,
              duration,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {

        setSimulation(
          result.data
        );

        setCurrentFrame(0);

      }

    } catch (error) {

      console.error(
        "Backend connection failed:",
        error
      );

    } finally {

      setLoadingStage("");
      setLoading(false);

    }

  };


  /* =====================================================
     LOAD SCENARIOS
  ===================================================== */

  const loadScenarios =
    async () => {

      try {

        setScenarioLoading(true);

        const response =
          await fetch(
            "http://localhost:5000/api/scenarios/compare"
          );

        const result =
          await response.json();

        if (result.success) {

          setScenarios(
            result.data
          );

        }

      } catch (error) {

        console.error(
          "Scenario comparison failed:",
          error
        );

      } finally {

        setScenarioLoading(false);

      }

    };


  /* =====================================================
     LOAD SIMULATION HISTORY
  ===================================================== */

  const loadHistory = async () => {

    try {

      setHistoryLoading(true);
      setHistoryError("");

      const response =
        await fetch(
          "http://localhost:5000/api/simulations"
        );

      const result =
        await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
          "Failed to load simulation history"
        );
      }

      setHistory(
        result.data || []
      );

    } catch (error) {

      console.error(
        "History loading failed:",
        error
      );

      setHistoryError(
        error instanceof Error
          ? error.message
          : "Failed to load simulation history"
      );

    } finally {

      setHistoryLoading(false);

    }
  };


  /* =====================================================
     OPEN SAVED SIMULATION
  ===================================================== */

  const openSimulation = async (
    id: string
  ) => {

    try {

      const response =
        await fetch(
          `http://localhost:5000/api/simulations/${id}`
        );

      const result =
        await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
          "Failed to load simulation"
        );
      }

      setSimulation(
        result.data
      );

      setRainfall(
        result.data.parameters?.rainfall ?? rainfall
      );

      setDrainageCapacity(
        result.data.parameters?.drainageCapacity ?? drainageCapacity
      );

      setInitialWaterLevel(
        result.data.parameters?.initialWaterLevel ?? initialWaterLevel
      );

      setDuration(
        result.data.parameters?.duration ?? duration
      );

      setCurrentFrame(0);
      setPlaying(false);
      setView("simulation");

    } catch (error) {

      console.error(
        "Open simulation failed:",
        error
      );

    }
  };


  /* =====================================================
     DELETE SAVED SIMULATION
  ===================================================== */

  const deleteSimulation = async (
    id: string,
    name: string
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${name}" from simulation history?`
      );

    if (!confirmed) {
      return;
    }

    try {

      const response =
        await fetch(
          `http://localhost:5000/api/simulations/${id}`,
          {
            method: "DELETE"
          }
        );

      const result =
        await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
          "Failed to delete simulation"
        );
      }

      setHistory(
        previous =>
          previous.filter(
            item =>
              item._id !== id
          )
      );

    } catch (error) {

      console.error(
        "Delete simulation failed:",
        error
      );

    }
  };


  /* =====================================================
     RESET
  ===================================================== */

  const resetScenario = () => {

    setRainfall(180);

    setDrainageCapacity(45);

    setInitialWaterLevel(20);

    setDuration(60);

    setSimulation(null);

    setCurrentFrame(0);

    setPlaying(false);

  };

  const loadScenarioIntoControls = (scenario: any) => {
    const parameters = scenario.parameters ?? {};

    setRainfall(Number(scenario.rainfall ?? parameters.rainfall ?? rainfall));
    setDrainageCapacity(Number(scenario.drainageCapacity ?? parameters.drainageCapacity ?? drainageCapacity));
    setInitialWaterLevel(Number(scenario.initialWaterLevel ?? parameters.initialWaterLevel ?? initialWaterLevel));
    setDuration(Number(scenario.duration ?? parameters.duration ?? duration));

    setSimulation(null);
    setCurrentFrame(0);
    setPlaying(false);
    setSelectedAsset(null);
    setView("simulation");
  };

  const exportDecisionBrief = () => {
    if (!simulation) return;

    const report = {
      project: "FLOWMIND AI — Flood Propagation & Decision Intelligence",
      generatedAt: new Date().toISOString(),
      parameters: simulation.parameters,
      summary: simulation.summary,
      impact: simulation.impact,
      decision: simulation.decision,
      interpretation: "Rainfall → Runoff → Terrain → Flow → Propagation → Impact"
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flowmind-decision-brief-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };


  /* =====================================================
     LOAD DATA WHEN REQUIRED
  ===================================================== */

  useEffect(() => {

    if (
      view === "scenarios" ||
      view === "analytics"
    ) {

      loadScenarios();

    }

    if (view === "history") {

      loadHistory();

    }

  }, [view]);


  /* =====================================================
     ANIMATION
  ===================================================== */

  useEffect(() => {

    if (
      !playing ||
      !simulation?.frames
    ) {

      return;

    }

    const frames =
      simulation.frames;

    if (
      currentFrame >=
      frames.length - 1
    ) {

      setPlaying(false);

      return;

    }

    const interval =
      setInterval(() => {

        setCurrentFrame(
          (previous: number) => {

            if (
              previous >=
              frames.length - 1
            ) {

              setPlaying(false);

              return previous;

            }

            return previous + 1;

          }
        );

      }, 900 / speed);

    return () =>
      clearInterval(interval);

  }, [
    playing,
    currentFrame,
    simulation,
    speed,
  ]);


  /* =====================================================
     CURRENT FRAME
  ===================================================== */

  const frame =
    simulation?.frames?.[
      currentFrame
    ];

  const currentWater =
    frame?.water ?? null;

  const currentTime =
    frame?.time ?? 0;

  const floodedCells =
    frame?.floodedCells ?? 0;

  const maxDepth =
    frame?.maxDepth ?? 0;

  const progress =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  const simulationPhase =
    progress < 20
      ? "SOURCE"
      : progress < 45
      ? "RUNOFF"
      : progress < 70
      ? "PROPAGATION"
      : progress < 90
      ? "IMPACT"
      : "PEAK RESPONSE";

  /* =====================================================
     DECISION DATA
  ===================================================== */

  const riskScore =
    simulation?.decision?.riskScore ??
    null;

  const riskLevel =
    simulation?.decision?.riskLevel ??
    "--";

  const recommendations =
    simulation?.decision?.recommendations ??
    [];

  const affectedZones =
    simulation?.impact?.affectedZones ??
    [];

  const criticalAssets =
    simulation?.impact?.criticalAssets ??
    [];


  /* =====================================================
     TERRAIN
  ===================================================== */

  const terrain =
    simulation?.terrain ?? [
      [82, 79, 75, 71, 68],
      [85, 81, 76, 72, 65],
      [89, 84, 78, 70, 61],
      [94, 88, 80, 69, 55],
      [98, 93, 86, 75, 58],
    ];

  /* =====================================================
     VISUAL ANALYTICS DATA
  ===================================================== */

  const depthSeries = simulation?.frames?.map((item: any) => ({
    time: item.time,
    depth: Number(item.maxDepth ?? 0),
    flooded: Number(item.floodedCells ?? 0),
  })) ?? [];

  const zoneChartData = affectedZones
    .slice()
    .sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0))
    .map((zone: any) => ({
      name: zone.name,
      depth: Number(zone.depth ?? 0),
      priority: Number(zone.priority ?? 0),
    }));

  const arrivalChartData = terrain
    .flatMap((row: number[], r: number) =>
      row.map((_: number, c: number) => {
        const value = simulation?.arrivalTime?.[r]?.[c];
        return {
          cell: `${r + 1}:${c + 1}`,
          arrival: value == null ? null : Number(value),
        };
      })
    )
    .filter((item: any) => item.arrival !== null);

  /* =====================================================
     WHAT HAPPENS NEXT — FORECAST SNAPSHOTS
  ===================================================== */

  const forecastTimes = simulation?.frames?.length
    ? [15, 30, 45].map((time) =>
        simulation.frames.reduce((best: any, item: any) =>
          Math.abs(item.time - time) < Math.abs(best.time - time) ? item : best
        )
      )
    : [];


  return (

    <div className="flowmind-chic min-h-screen bg-[#07100f] text-slate-100">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-white/10 bg-[#091513]/95 px-8 py-5">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10">

              <Waves className="h-6 w-6 text-emerald-400" />

            </div>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-xl font-semibold">
                  FLOWMIND
                </h1>

                <span className="text-xl font-semibold text-emerald-400">
                  AI
                </span>

              </div>

              <p className="text-xs text-slate-500">
                Flood Propagation & Decision Intelligence
              </p>

            </div>

          </div>


          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs text-emerald-300">

              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

              SYSTEM ONLINE

            </div>

            <button
              className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-400 hover:bg-white/10"
            >
              <Settings2 size={18} />
            </button>

          </div>

        </div>


        {/* NAVIGATION */}

        <div className="mt-5 flex gap-2">

          <NavButton
            active={
              view === "simulation"
            }
            icon={
              <Activity size={14} />
            }
            label="Live Simulation"
            onClick={() =>
              setView(
                "simulation"
              )
            }
          />

          <NavButton
            active={
              view === "scenarios"
            }
            icon={
              <GitCompare size={14} />
            }
            label="Scenario Lab"
            onClick={() =>
              setView(
                "scenarios"
              )
            }
          />

          <NavButton
            active={
              view === "analytics"
            }
            icon={
              <BarChart3 size={14} />
            }
            label="Analytics"
            onClick={() =>
              setView(
                "analytics"
              )
            }
          />

          <NavButton
            active={
              view === "history"
            }
            icon={
              <History size={14} />
            }
            label="Past Runs"
            onClick={() =>
              setView(
                "history"
              )
            }
          />

        </div>

      </header>


      {/* =================================================
          ANALYTICS
      ================================================= */}

      {view === "analytics" ? (

        <AnalyticsDashboard
          scenarios={scenarios}
          loading={scenarioLoading}
          simulation={simulation}
        />

      ) : view === "scenarios" ? (

        <ScenarioLab
          scenarios={scenarios}
          loading={scenarioLoading}
          onRefresh={loadScenarios}
          onLoadScenario={loadScenarioIntoControls}
        />

      ) : view === "history" ? (

        <HistoryPanel
          history={history}
          loading={historyLoading}
          error={historyError}
          onRefresh={loadHistory}
          onOpen={openSimulation}
          onDelete={deleteSimulation}
        />

      ) : (


        /* =================================================
           LIVE SIMULATION
        ================================================= */

        <main className="grid min-h-[calc(100vh-140px)] grid-cols-[270px_1fr_310px]">


          {/* LEFT */}

          <aside className="border-r border-white/10 bg-[#091412] p-5">

            <div className="mb-7">

              <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                Scenario Control
              </p>

              <h2 className="text-lg font-semibold">
                Flood Scenario
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Configure environmental conditions for propagation analysis.
              </p>

            </div>


            <Control
              label="Rainfall"
              value={`${rainfall} mm`}
            >

              <input
                type="range"
                min="50"
                max="300"
                value={rainfall}
                onChange={(e) =>
                  setRainfall(
                    Number(e.target.value)
                  )
                }
                className="w-full accent-emerald-400"
              />

            </Control>


            <Control
              label="Drainage Capacity"
              value={`${drainageCapacity}%`}
            >

              <input
                type="range"
                min="0"
                max="100"
                value={drainageCapacity}
                onChange={(e) =>
                  setDrainageCapacity(
                    Number(e.target.value)
                  )
                }
                className="w-full accent-emerald-400"
              />

            </Control>


            <Control
              label="Initial Water Level"
              value={`${initialWaterLevel} cm`}
            >

              <input
                type="range"
                min="0"
                max="100"
                value={initialWaterLevel}
                onChange={(e) =>
                  setInitialWaterLevel(
                    Number(e.target.value)
                  )
                }
                className="w-full accent-emerald-400"
              />

            </Control>


            <div className="mb-7">

              <label className="mb-2 block text-sm text-slate-300">
                Simulation Duration
              </label>

              <select
                value={duration}
                onChange={(e) =>
                  setDuration(
                    Number(e.target.value)
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
              >

                <option value={60}>
                  60 minutes
                </option>

                <option value={120}>
                  120 minutes
                </option>

                <option value={180}>
                  180 minutes
                </option>

              </select>

            </div>


            <button
              onClick={
                runSimulation
              }
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#06100e] hover:bg-emerald-300 disabled:opacity-50"
            >

              <Play size={16} />

              {loading
                ? loadingStage || "Running…"
                : "Run Simulation"}

            </button>


            <button
              onClick={
                resetScenario
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
            >

              <RotateCcw size={16} />

              Reset Scenario

            </button>


            <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.025] p-4">

              <div className="mb-3 flex items-center gap-2">

                <Target
                  size={15}
                  className="text-emerald-400"
                />

                <span className="text-xs font-semibold">
                  Active Parameters
                </span>

              </div>

              <div className="space-y-2 text-[11px]">

                <Parameter
                  label="Rainfall"
                  value={`${rainfall} mm`}
                />

                <Parameter
                  label="Drainage"
                  value={`${drainageCapacity}%`}
                />

                <Parameter
                  label="Initial water"
                  value={`${initialWaterLevel} cm`}
                />

              </div>

            </div>

          </aside>


          {/* CENTER */}

          <section className="bg-[#07100f] p-6">

            <div className="mb-5 flex items-end justify-between">

              <div>

                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Live Simulation
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Terrain Propagation Model
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Dynamic water-flow propagation across elevation cells
                </p>

                <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Physics-inspired synthetic terrain model
                </div>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => setVisualizationMode("depth")}
                  className={`rounded-lg px-3 py-2 text-xs transition ${
                    visualizationMode === "depth"
                      ? "border border-cyan-300/40 bg-cyan-300/10 text-cyan-200"
                      : "border border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  Flood Depth
                </button>

                <button
                  onClick={() => setVisualizationMode("flow")}
                  className={`rounded-lg px-3 py-2 text-xs transition ${
                    visualizationMode === "flow"
                      ? "border border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                      : "border border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  Flow Direction
                </button>

                <button
                  onClick={() => setVisualizationMode("arrival")}
                  className={`rounded-lg px-3 py-2 text-xs transition ${
                    visualizationMode === "arrival"
                      ? "border border-amber-300/40 bg-amber-300/10 text-amber-200"
                      : "border border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  Arrival Time
                </button>

              </div>

              {simulation && (
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  className="flowmind-export-btn"
                  title="Export the current simulation decision brief"
                >
                  <ArrowUpRight size={14} />
                  Decision report
                </button>
              )}

            </div>


            {simulation && (
              <div className="flowmind-executive-summary mb-5">
                <div className="flowmind-executive-head">
                  <div>
                    <p className="flowmind-kicker">Executive assessment</p>
                    <h3>Current flood intelligence</h3>
                  </div>
                  <span className={`flowmind-risk-pill ${String(riskLevel || "LOW").toLowerCase()}`}>
                    {riskLevel || "LOW"}
                  </span>
                </div>
                <div className="flowmind-executive-grid">
                  <div><span>Risk score</span><strong>{riskScore}/100</strong></div>
                  <div><span>Peak depth</span><strong>{Number(maxDepth).toFixed(2)} m</strong></div>
                  <div><span>Affected cells</span><strong>{floodedCells}</strong></div>
                  <div><span>Earliest arrival</span><strong>{simulation.summary?.earliestArrival ?? "—"} min</strong></div>
                </div>
              </div>
            )}

            {/* TERRAIN */}

            <div className="flowmind-map-card rounded-2xl border border-white/10 bg-[#0b1916] p-5">

              <div className="flowmind-map-toolbar mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPinned size={15} className="text-cyan-600" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Geospatial propagation map</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Synthetic watershed · 25 elevation cells · live simulation state</p>
                  </div>
                </div>
                <div className="flowmind-layer-switcher">
                  <div className="flowmind-layer-group">
                    <span className="flowmind-layer-label">Base</span>
                    <div className="flowmind-layer-segment">
                      {([
                        ["terrain", "Terrain"],
                        ["hydrology", "Hydrology"],
                        ["response", "Response"],
                      ] as const).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setMapBase(key)}
                          className={mapBase === key ? "is-active" : ""}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flowmind-layer-group">
                    <span className="flowmind-layer-label"><Layers3 size={11} /> Layers</span>
                    <div className="flowmind-layer-chips">
                      {([
                        ["drainage", "Drainage"],
                        ["roads", "Roads"],
                        ["infrastructure", "Assets"],
                        ["riskZones", "Risk zones"],
                      ] as const).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className={mapLayers[key] ? "is-active" : ""}
                        >
                          {key === "drainage" ? <Waves size={11} /> : key === "roads" ? <Route size={11} /> : <Building2 size={11} />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`flowmind-map-viewport ${mapDragOrigin ? "is-dragging" : ""}`}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest("button")) return;
                  setMapDragOrigin({ x: event.clientX, y: event.clientY, panX: mapPan.x, panY: mapPan.y });
                }}
                onPointerMove={(event) => {
                  if (!mapDragOrigin) return;
                  setMapPan({
                    x: mapDragOrigin.panX + (event.clientX - mapDragOrigin.x) * 1.25,
                    y: mapDragOrigin.panY + (event.clientY - mapDragOrigin.y) * 1.25,
                  });
                }}
                onPointerUp={() => setMapDragOrigin(null)}
                onPointerCancel={() => setMapDragOrigin(null)}
                onPointerLeave={() => setMapDragOrigin(null)}
                onWheel={(event) => {
                  setMapZoom((z) => {
                    const next = z + (event.deltaY < 0 ? 0.1 : -0.1);
                    return Number(Math.min(1.8, Math.max(1, next)).toFixed(2));
                  });
                }}
              >
                <div className="flowmind-map-controls" aria-label="Map controls">
                  <button type="button" aria-label="Zoom out" onClick={() => setMapZoom((z) => Math.max(1, Number((z - 0.15).toFixed(2))))}>−</button>
                  <span>{Math.round(mapZoom * 100)}%</span>
                  <button type="button" aria-label="Zoom in" onClick={() => setMapZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}>+</button>
                  <button type="button" aria-label="Reset map view" onClick={() => { setMapZoom(1); setMapPan({ x: 0, y: 0 }); }}>↺</button>
                </div>
                <div className="flowmind-map-hint">Drag to pan · Scroll to zoom</div>
                <div className="flowmind-map-legend">
                  <div className="flowmind-map-legend-title">{visualizationMode === "depth" ? "Flood depth" : visualizationMode === "arrival" ? "Arrival time" : "Flow direction"}</div>
                  {visualizationMode === "depth" && <div className="flowmind-depth-scale"><span>0 m</span><div></div><span>1 m+</span></div>}
                  {visualizationMode === "arrival" && <div className="flowmind-arrival-scale"><span>Early</span><div></div><span>Late</span></div>}
                  {visualizationMode === "flow" && <div className="flowmind-flow-key"><span>→</span> Downslope flow</div>}
                </div>
                <svg viewBox="0 0 900 430" role="img" aria-label="Flood propagation map" className="flowmind-map-svg">
                  <defs>
                    <linearGradient id="fmLand" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f3faf8" />
                      <stop offset="100%" stopColor="#dcefeb" />
                    </linearGradient>
                    <linearGradient id="fmWater" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8de3f1" />
                      <stop offset="100%" stopColor="#1683a6" />
                    </linearGradient>
                    <filter id="fmShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#42756e" floodOpacity=".14" />
                    </filter>
                  </defs>

                  <rect
                    x="0"
                    y="0"
                    width="900"
                    height="430"
                    rx="18"
                    fill={mapBase === "terrain" ? "url(#fmLand)" : mapBase === "hydrology" ? "#e5f5f4" : "#edf3f6"}
                  />

                  <g transform={`translate(${450 + mapPan.x} ${215 + mapPan.y}) scale(${mapZoom}) translate(-450 -215)`}>

                  {/* watershed contour lines */}
                  {[75, 140, 205, 270, 335, 390].map((y, i) => (
                    <path key={`contour-${i}`} d={`M20 ${y} C150 ${y-55} 270 ${y+55} 410 ${y-8} S650 ${y-45} 885 ${y+10}`} fill="none" stroke={mapBase === "hydrology" ? "#9bcfc9" : "#c5ddd8"} strokeWidth="1.6" opacity={mapBase === "response" ? ".55" : ".82"} />
                  ))}

                  {/* response / risk zones */}
                  {mapLayers.riskZones && (
                    <g opacity={mapBase === "response" ? 0.42 : 0.18}>
                      <path d="M520 48 C650 28 790 55 850 120 L820 215 C720 235 635 208 555 165 Z" fill="#e3a13a" />
                      <path d="M245 245 C335 215 440 235 505 310 L455 400 C345 388 275 345 220 295 Z" fill="#2b9f8e" />
                      <path d="M610 245 C680 215 775 240 845 305 L800 390 C715 375 650 340 600 300 Z" fill="#d9534f" />
                      <text x="655" y="82" fontSize="8" fontWeight="800" fill="#9b6b21" letterSpacing="1.1">HIGH RISK</text>
                      <text x="275" y="365" fontSize="8" fontWeight="800" fill="#247a6d" letterSpacing="1.1">MONITOR</text>
                      <text x="704" y="355" fontSize="8" fontWeight="800" fill="#a64542" letterSpacing="1.1">CRITICAL</text>
                    </g>
                  )}

                  {/* river / drainage channel */}
                  {mapLayers.drainage && <>
                    <path d="M78 28 C205 88 172 151 242 205 S305 321 272 420" fill="none" stroke="#78cbd0" strokeWidth="15" opacity=".16" />
                    <path d="M78 28 C205 88 172 151 242 205 S305 321 272 420" fill="none" stroke="#63bfc6" strokeWidth="4" opacity=".85" />
                    <path d="M585 28 C520 105 563 164 520 230 S510 350 452 414" fill="none" stroke="#8ac9c5" strokeWidth="9" opacity=".13" />
                    <path d="M585 28 C520 105 563 164 520 230 S510 350 452 414" fill="none" stroke="#7ab9b4" strokeWidth="2.5" opacity=".7" />
                  </>}

                  {/* roads */}
                  {mapLayers.roads && <>
                    <path d="M105 350 L230 275 L395 290 L565 205 L800 150" fill="none" stroke="#ffffff" strokeWidth="15" opacity=".95" />
                    <path d="M105 350 L230 275 L395 290 L565 205 L800 150" fill="none" stroke="#a9bbb7" strokeWidth="2.5" strokeDasharray="9 6" />
                    <path d="M170 65 L310 130 L470 155 L625 120 L825 62" fill="none" stroke="#ffffff" strokeWidth="11" opacity=".9" />
                    <path d="M170 65 L310 130 L470 155 L625 120 L825 62" fill="none" stroke="#b7c8c4" strokeWidth="2" strokeDasharray="7 6" />
                  </>}

                  {/* map labels */}
                  <text x="42" y="405" fontSize="9" fontWeight="700" fill="#76918a" letterSpacing="1.2">LOW-LYING WATERSHED</text>
                  <text x="705" y="35" fontSize="9" fontWeight="700" fill="#76918a" letterSpacing="1.2">UPSTREAM RIDGE</text>

                  {/* simulation cells */}
                  {Array.from({ length: 25 }).map((_, index) => {
                    const row = Math.floor(index / 5), col = index % 5;
                    const x = 205 + col * 92, y = 55 + row * 72;
                    const waterDepth = currentWater?.[row]?.[col] ?? 0;
                    const flooded = waterDepth > 0.05;
                    const arrival = simulation?.arrivalTime?.[row]?.[col];
                    const elevation = terrain[row]?.[col] ?? 0;
                    const direction = simulation?.flowDirections?.[row]?.[col] ?? "NONE";
                    const arrows: Record<string,string> = {N:"↑",S:"↓",E:"→",W:"←",NE:"↗",NW:"↖",SE:"↘",SW:"↙",NONE:"·"};
                    const depthOpacity = Math.min(.88, .12 + waterDepth * 1.8);
                    return (
                      <g key={`map-cell-${index}`} filter={flooded ? "url(#fmShadow)" : undefined}>
                        <rect x={x} y={y} width="78" height="58" rx="9" fill={flooded ? `rgba(31,151,190,${depthOpacity})` : "rgba(255,255,255,.62)"} stroke={flooded ? "#1683a6" : "#b7cfca"} strokeWidth={flooded ? "2" : "1.2"} />
                        <text x={x+8} y={y+14} fontSize="8" fill={flooded ? "#e9fbff" : "#68817a"}>C{row+1}:{col+1}</text>
                        <text x={x+39} y={y+35} textAnchor="middle" fontSize="15" fontWeight="700" fill={flooded ? "#fff" : "#315b57"}>{visualizationMode === "arrival" ? (arrival != null ? `${arrival}m` : "—") : elevation}</text>
                        {visualizationMode === "depth" && <text x={x+39} y={y+50} textAnchor="middle" fontSize="7" fill={flooded ? "#dffaff" : "#718b84"}>{waterDepth > 0 ? `${waterDepth.toFixed(2)}m water` : "dry"}</text>}
                        {visualizationMode === "flow" && <text x={x+39} y={y+51} textAnchor="middle" fontSize="18" fontWeight="800" fill="#147ca6">{arrows[direction]}</text>}
                      </g>
                    );
                  })}

                  {/* source */}
                  <g filter="url(#fmShadow)" onClick={() => setSelectedAsset({name:"Source / inlet",type:"Simulation source",priority:4,arrival:0,depth:currentWater?.[0]?.[0] ?? 0,status:"Active inflow source"})}>
                    <circle cx="118" cy="85" r="14" fill="#fff" stroke="#1683a6" strokeWidth="2" />
                    <path d="M111 85h14M118 78v14" stroke="#1683a6" strokeWidth="2" />
                    <text x="140" y="89" fontSize="11" fontWeight="700" fill="#284a46">Source / inlet</text>
                  </g>

                  {/* critical assets */}
                  <g filter="url(#fmShadow)" onClick={() => setSelectedAsset({name:"Critical zone",type:"Priority response zone",priority:5,arrival:simulation?.arrivalTime?.[1]?.[4] ?? null,depth:currentWater?.[1]?.[4] ?? 0,status:(currentWater?.[1]?.[4] ?? 0) > .05 ? "Flood exposure detected" : "Monitoring"})}>
                    <circle cx="770" cy="95" r="15" fill="#fff" stroke="#e09a38" strokeWidth="2.5" />
                    <path d="M763 95h14M770 88v14" stroke="#e09a38" strokeWidth="2" />
                    <text x="792" y="99" fontSize="11" fontWeight="700" fill="#284a46">Critical zone</text>
                  </g>

                  {/* infrastructure markers */}
                  {mapLayers.infrastructure && <>
                  <g className="flowmind-map-asset" onClick={() => setSelectedAsset({name:"Hospital",type:"Critical infrastructure",priority:5,arrival:simulation?.arrivalTime?.[2]?.[4] ?? null,depth:currentWater?.[2]?.[4] ?? 0,status:(currentWater?.[2]?.[4] ?? 0) > .05 ? "Flood exposure detected" : "Monitoring"})}>
                    <circle cx="576" cy="245" r="11" fill="#fff" stroke="#d9534f" strokeWidth="2" />
                    <path d="M570 245h12M576 239v12" stroke="#d9534f" strokeWidth="1.8" />
                    <text x="591" y="248" fontSize="8" fontWeight="700" fill="#607c75">Hospital</text>
                  </g>
                  <g className="flowmind-map-asset" onClick={() => setSelectedAsset({name:"School",type:"Critical infrastructure",priority:5,arrival:simulation?.arrivalTime?.[3]?.[3] ?? null,depth:currentWater?.[3]?.[3] ?? 0,status:(currentWater?.[3]?.[3] ?? 0) > .05 ? "Flood exposure detected" : "Monitoring"})}>
                    <circle cx="485" cy="290" r="11" fill="#fff" stroke="#d98b24" strokeWidth="2" />
                    <path d="M480 291l5-6 5 6v6h-10z" fill="none" stroke="#d98b24" strokeWidth="1.5" />
                    <text x="500" y="293" fontSize="8" fontWeight="700" fill="#607c75">School</text>
                  </g>
                  </>}

                  {/* scale */}
                  <g>
                    <rect x="28" y="375" width="150" height="34" rx="8" fill="rgba(255,255,255,.94)" stroke="#c7dad6" />
                    <text x="42" y="390" fontSize="8" fill="#68817a">FLOOD DEPTH</text>
                    <rect x="42" y="397" width="105" height="4" rx="2" fill="url(#fmWater)" />
                    <text x="42" y="409" fontSize="7" fill="#81948e">0 m</text>
                    <text x="135" y="409" fontSize="7" fill="#81948e">1 m+</text>
                  </g>
                  </g>
                </svg>
                <div className="flowmind-map-overlay"><span><Navigation size={11} /> North</span><span><span className="flowmind-live-dot" /> Live T+{currentTime} min</span></div>
              </div>

              {selectedAsset && (
                <div className="flowmind-map-detail mt-3">
                  <div>
                    <p className="flowmind-map-detail-kicker">Selected map feature</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="flowmind-map-detail-dot" />
                      <h3>{selectedAsset.name}</h3>
                      <span>{selectedAsset.type}</span>
                    </div>
                  </div>
                  <div className="flowmind-map-detail-stats">
                    <div><span>Priority</span><strong>P{selectedAsset.priority}</strong></div>
                    <div><span>Arrival</span><strong>{selectedAsset.arrival != null ? `T+${selectedAsset.arrival}m` : "—"}</strong></div>
                    <div><span>Depth</span><strong>{selectedAsset.depth.toFixed(2)} m</strong></div>
                    <div><span>Status</span><strong>{selectedAsset.status}</strong></div>
                  </div>
                  <button type="button" onClick={() => setSelectedAsset(null)} className="flowmind-map-detail-close">Close</button>
                </div>
              )}

            </div>


            {/* PROPAGATION TIMELINE */}

            <div className="flowmind-timeline mt-5 rounded-xl border border-white/10 bg-[#091513] p-4">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400">
                    Propagation timeline
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-semibold tracking-tight">
                      T + {currentTime} min
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      {simulationPhase}
                    </span>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  {duration} min window
                </span>
              </div>

              <div className="mt-5 flowmind-timeline-track">
                <div
                  className="flowmind-timeline-fill"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="flowmind-timeline-marker"
                  style={{ left: `${progress}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-5 gap-2">
                {[
                  ["SOURCE", "0%"],
                  ["RUNOFF", "20%"],
                  ["PROPAGATION", "45%"],
                  ["IMPACT", "70%"],
                  ["PEAK", "90%"],
                ].map(([label, point]) => {
                  const active = progress >= Number(point.replace("%", ""));
                  return (
                    <div key={label} className={`flowmind-phase ${active ? "is-active" : ""}`}>
                      <span className="flowmind-phase-dot" />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600">
                <span>Simulation start</span>
                <span className="text-slate-500">Live state synchronized with terrain propagation</span>
                <span>Simulation end</span>
              </div>

            </div>


            {/* WHAT HAPPENS NEXT */}

            {simulation && forecastTimes.length > 0 && (
              <div className="flowmind-forecast mt-4">
                <div className="flowmind-forecast-head">
                  <div>
                    <p className="flowmind-section-kicker">What happens next</p>
                    <h3>Propagation forecast</h3>
                  </div>
                  <span>Projected from current simulation</span>
                </div>

                <div className="flowmind-forecast-grid">
                  {forecastTimes.map((item: any, index: number) => {
                    const labels = ["Near-term", "Mid-window", "Peak window"];
                    const risk = Number(item.maxDepth ?? 0) > 1 ? "CRITICAL" : Number(item.floodedCells ?? 0) >= 15 ? "HIGH" : "MODERATE";
                    return (
                      <div className="flowmind-forecast-card" key={`${item.time}-${index}`}>
                        <div className="flowmind-forecast-time">T+{item.time} min</div>
                        <div className="flowmind-forecast-label">{labels[index]}</div>
                        <div className="flowmind-forecast-main">
                          <strong>{item.floodedCells ?? 0}</strong>
                          <span>cells exposed</span>
                        </div>
                        <div className="flowmind-forecast-row">
                          <span>Max depth</span>
                          <b>{Number(item.maxDepth ?? 0).toFixed(2)} m</b>
                        </div>
                        <div className="flowmind-forecast-row">
                          <span>Response state</span>
                          <b className={`flowmind-forecast-risk ${risk.toLowerCase()}`}>{risk}</b>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* CONTROLS */}

            <div className="mt-4 rounded-xl border border-white/10 bg-[#091513] p-4">

              <div className="flex items-center gap-3">

                <button
                  onClick={() =>
                    setPlaying(
                      !playing
                    )
                  }
                  disabled={!simulation}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400 text-[#06100e] disabled:opacity-30"
                >

                  {playing ? (
                    <Pause size={17} />
                  ) : (
                    <Play size={17} />
                  )}

                </button>


                <button
                  onClick={() =>
                    setCurrentFrame(
                      0
                    )
                  }
                  disabled={!simulation}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 disabled:opacity-30"
                >

                  <RotateCcw size={16} />

                </button>


                <div className="flex-1">

                  <input
                    type="range"
                    min="0"
                    max={
                      simulation?.frames
                        ?.length
                        ? simulation.frames
                            .length - 1
                        : 0
                    }
                    value={
                      currentFrame
                    }
                    onChange={(e) =>
                      setCurrentFrame(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full accent-emerald-400"
                  />

                </div>


                <select
                  value={speed}
                  onChange={(e) =>
                    setSpeed(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs"
                >

                  <option value={0.5}>
                    0.5×
                  </option>

                  <option value={1}>
                    1×
                  </option>

                  <option value={2}>
                    2×
                  </option>

                  <option value={4}>
                    4×
                  </option>

                </select>

              </div>


              <div className="mt-3 flex justify-between text-[10px] text-slate-600">

                <span>0m</span>

                <span>
                  T + {currentTime}m
                </span>

                <span>
                  {duration}m
                </span>

              </div>

            </div>


            <div className="mt-5 grid grid-cols-3 gap-3">

              <MiniStat
                label="Current Flooded Cells"
                value={`${floodedCells}`}
              />

              <MiniStat
                label="Current Max Depth"
                value={`${maxDepth} m`}
              />

              <MiniStat
                label="Simulation Step"
                value={`${currentFrame + 1}/${
                  simulation?.frames
                    ?.length ?? "--"
                }`}
              />

            </div>

            {simulation && (
              <section className="flowmind-analytics mt-5">
                <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-700">Visual analytics</p><h3 className="mt-1 text-lg font-semibold text-slate-800">Propagation evidence</h3></div><span className="text-[10px] text-slate-400">Derived from simulation frames</span></div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <ChartCard title="Flood depth over time" description="Peak depth progression" icon={<Droplets size={15} className="text-cyan-600" />}><ResponsiveContainer width="100%" height="100%"><LineChart data={depthSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" tickFormatter={(v) => `T+${v}`} /><YAxis /><Tooltip formatter={(v: any) => [`${Number(v).toFixed(3)} m`, "Max depth"]} /><Line type="monotone" dataKey="depth" stroke="#1683a6" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></ChartCard>
                  <ChartCard title="Flooded area growth" description="Affected terrain cells" icon={<Waves size={15} className="text-teal-600" />}><ResponsiveContainer width="100%" height="100%"><LineChart data={depthSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" tickFormatter={(v) => `T+${v}`} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="flooded" stroke="#2b9f8e" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></ChartCard>
                  <ChartCard title="Impact by priority zone" description="Depth at decision points" icon={<Building2 size={15} className="text-amber-600" />}><ResponsiveContainer width="100%" height="100%"><BarChart data={zoneChartData} layout="vertical" margin={{left:10,right:10}}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} tick={{fontSize:10}} /><Tooltip formatter={(v:any)=>[`${Number(v).toFixed(2)} m`,"Depth"]}/><Bar dataKey="depth" fill="#e09a38" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></ChartCard>
                  <ChartCard title="Water arrival profile" description="First arrival across cells" icon={<Route size={15} className="text-indigo-600" />}><ResponsiveContainer width="100%" height="100%"><BarChart data={arrivalChartData} margin={{left:4,right:12}}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="cell" interval={2} angle={-35} textAnchor="end" height={55} /><YAxis /><Tooltip formatter={(v:any)=>[`${v} min`,"Arrival"]}/><Bar dataKey="arrival" fill="#5273b7" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartCard>
                </div>
              </section>
            )}

          </section>


          {/* RIGHT */}

          <aside className="border-l border-white/10 bg-[#091412] p-5">

            <div className="mb-6">

              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                AI Intelligence
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Situation Overview
              </h2>

            </div>


            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <ShieldAlert
                    size={17}
                    className="text-red-400"
                  />

                  <span className="text-sm text-slate-300">
                    Risk Level
                  </span>

                </div>

                <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-400">
                  {riskLevel}
                </span>

              </div>


              <div className="mt-4 flowmind-risk-wrap">

                <div
                  className="flowmind-risk-ring"
                  style={{
                    background: `conic-gradient(from 225deg, #d7ff52 0deg, #d7ff52 ${Math.max(0, Math.min(100, Number(riskScore ?? 0))) * 2.7}deg, rgba(255,255,255,.08) ${Math.max(0, Math.min(100, Number(riskScore ?? 0))) * 2.7}deg, rgba(255,255,255,.08) 270deg, transparent 270deg 360deg)`,
                  }}
                >
                  <div className="flowmind-risk-ring-inner">
                    <span className="flowmind-risk-number">
                      {riskScore ?? "--"}
                    </span>
                    {simulation && (
                      <span className="flowmind-risk-denom">/100</span>
                    )}
                  </div>
                </div>

                <div className="flowmind-risk-scale">
                  <span>LOW</span>
                  <span>MODERATE</span>
                  <span>HIGH</span>
                  <span>CRITICAL</span>
                </div>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                Composite flood impact score · calculated from rainfall, drainage, depth, spread and critical assets
              </p>

            </div>


            <div className="grid grid-cols-2 gap-3">

              <Metric
                icon={
                  <Droplets
                    size={16}
                  />
                }
                label="Max Depth"
                value={
                  simulation
                    ? `${maxDepth} m`
                    : "--"
                }
              />

              <Metric
                icon={
                  <Clock3
                    size={16}
                  />
                }
                label="Arrival"
                value={
                  simulation
                    ? `${simulation.summary?.earliestArrival ?? "--"} min`
                    : "--"
                }
              />

              <Metric
                icon={
                  <Gauge
                    size={16}
                  />
                }
                label="Flooded Area"
                value={
                  simulation
                    ? `${floodedCells} cells`
                    : "--"
                }
              />

              <Metric
                icon={
                  <AlertTriangle
                    size={16}
                  />
                }
                label="Affected"
                value={
                  simulation
                    ? `${affectedZones.length} zones`
                    : "--"
                }
              />

            </div>


            {simulation && (

              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">

                <div className="flex items-center gap-2">

                  <AlertTriangle
                    size={15}
                    className="text-amber-400"
                  />

                  <span className="text-xs font-semibold">
                    Critical Infrastructure
                  </span>

                </div>

                <p className="mt-2 text-2xl font-semibold text-amber-400">
                  {
                    criticalAssets.length
                  }
                </p>

                <p className="text-[11px] text-slate-500">
                  assets requiring priority monitoring
                </p>

              </div>

            )}


            {simulation && affectedZones.length > 0 && (

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">

                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Impact queue</p>
                    <h3 className="mt-1 text-sm font-semibold">Priority zones</h3>
                  </div>
                  <span className="text-[10px] text-slate-600">{affectedZones.length} detected</span>
                </div>

                <div className="space-y-2">
                  {affectedZones
                    .slice()
                    .sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0))
                    .slice(0, 4)
                    .map((zone: any, index: number) => (
                      <div key={`${zone.name}-${index}`} className="flowmind-zone-row">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-slate-300">{zone.name}</p>
                          <p className="mt-0.5 text-[9px] text-slate-600">
                            Arrival {zone.arrivalTime ?? "--"} min · Priority {zone.priority ?? "--"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-amber-300">
                          {zone.depth ?? "--"} m
                        </span>
                      </div>
                    ))}
                </div>

              </div>

            )}


            <div className="mt-6">

              <div className="mb-3 flex items-center gap-2">

                <AlertTriangle
                  size={16}
                  className="text-amber-400"
                />

                <h3 className="text-sm font-semibold">
                  Recommended Actions
                </h3>

              </div>

              <div className="space-y-2">

                {recommendations.length >
                0
                  ? recommendations.map(
                      (
                        recommendation: string,
                        index: number
                      ) => (
                        <Recommendation
                          key={
                            index
                          }
                          text={
                            recommendation
                          }
                        />
                      )
                    )
                  : (
                    <Recommendation
                      text="Run a simulation to generate recommendations."
                    />
                  )}

              </div>

            </div>


            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4">

              <div className="flex items-center gap-2">

                <Activity
                  size={15}
                  className="text-emerald-400"
                />

                <span className="text-xs font-medium">
                  Engine Status
                </span>

              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">

                {simulation
                  ? "Propagation analysis completed successfully."
                  : "Configure a scenario and run the propagation engine."}

              </p>

            </div>

          </aside>

        </main>

      )}

      {showReport && simulation && (
        <DecisionReportModal
          simulation={simulation}
          parameters={{ rainfall, drainageCapacity, initialWaterLevel, duration }}
          onClose={() => setShowReport(false)}
          onExport={exportDecisionBrief}
        />
      )}

    </div>

  );
}


/* =========================================================
   DECISION REPORT
========================================================= */

function DecisionReportModal({ simulation, parameters, onClose, onExport }: {
  simulation: any;
  parameters: { rainfall: number; drainageCapacity: number; initialWaterLevel: number; duration: number };
  onClose: () => void;
  onExport: () => void;
}) {
  const risk = simulation.decision?.riskLevel ?? "UNASSESSED";
  const score = simulation.decision?.riskScore ?? 0;
  const affected = simulation.impact?.affectedZones ?? [];
  const summary = simulation.summary ?? {};
  const recommendations = simulation.decision?.recommendations ?? [];

  return (
    <div className="flowmind-report-backdrop" onMouseDown={onClose}>
      <section className="flowmind-report-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flowmind-report-toolbar">
          <div>
            <p className="flowmind-report-kicker">FLOWMIND AI · DECISION INTELLIGENCE</p>
            <h2>Flood Impact Decision Brief</h2>
            <p>Simulation evidence and recommended response priorities</p>
          </div>
          <div className="flowmind-report-actions">
            <button type="button" onClick={onExport} className="flowmind-report-secondary">Export JSON</button>
            <button type="button" onClick={onClose} className="flowmind-report-close">×</button>
          </div>
        </div>

        <div className="flowmind-report-paper">
          <div className="flowmind-report-title-row">
            <div><span>SIMULATION REPORT</span><h3>Flood Propagation & Decision Intelligence</h3></div>
            <div className={`flowmind-report-risk risk-${String(risk).toLowerCase()}`}><small>RISK</small><strong>{risk}</strong><b>{score}/100</b></div>
          </div>
          <div className="flowmind-report-method">RAINFALL <i>→</i> RUNOFF <i>→</i> TERRAIN <i>→</i> FLOW <i>→</i> PROPAGATION <i>→</i> IMPACT</div>
          <div className="flowmind-report-grid">
            <div><small>Rainfall</small><strong>{parameters.rainfall} mm</strong></div>
            <div><small>Drainage capacity</small><strong>{parameters.drainageCapacity}%</strong></div>
            <div><small>Initial water</small><strong>{parameters.initialWaterLevel} cm</strong></div>
            <div><small>Duration</small><strong>{parameters.duration} min</strong></div>
            <div><small>Maximum depth</small><strong>{summary.maxDepth ?? 0} m</strong></div>
            <div><small>Flooded area</small><strong>{summary.floodedArea ?? 0} cells</strong></div>
            <div><small>Earliest arrival</small><strong>{summary.earliestArrival ?? "—"} min</strong></div>
            <div><small>Critical assets</small><strong>{simulation.impact?.criticalAssetCount ?? 0}</strong></div>
          </div>
          <div className="flowmind-report-columns">
            <div><h4>Priority zones</h4>{affected.length ? affected.slice().sort((a:any,b:any)=>(b.priority??0)-(a.priority??0)).slice(0,5).map((zone:any,i:number)=><div className="flowmind-report-zone" key={`${zone.name}-${i}`}><span><b>{zone.name}</b><small>Arrival {zone.arrivalTime ?? "—"} min · Priority {zone.priority ?? "—"}</small></span><strong>{zone.depth ?? 0} m</strong></div>) : <p className="flowmind-report-muted">No affected zones detected.</p>}</div>
            <div><h4>Recommended response</h4><ol className="flowmind-report-actions-list">{recommendations.slice(0,5).map((item:string,i:number)=><li key={i}>{item}</li>)}</ol></div>
          </div>
          <div className="flowmind-report-footer"><span>Physics-inspired synthetic watershed model</span><span>Generated {new Date().toLocaleString()}</span></div>
        </div>
      </section>
    </div>
  );
}


/* =========================================================
   ANALYTICS DASHBOARD
========================================================= */

function AnalyticsDashboard({
  scenarios,
  loading,
  simulation,
}: {
  scenarios: any[];
  loading: boolean;
  simulation: any;
}) {

  const chartData =
    scenarios.map(
      (scenario) => ({
        name:
          scenario.name,
        risk:
          scenario.riskScore,
        depth:
          scenario.maxDepth,
        flooded:
          scenario.floodedArea,
      })
    );


  const timelineData =
    simulation?.frames?.map(
      (frame: any) => ({
        time: frame.time,
        flooded:
          frame.floodedCells,
        depth:
          frame.maxDepth,
      })
    ) ?? [];


  const highestRisk =
    scenarios.length
      ? Math.max(
          ...scenarios.map(
            (s) =>
              s.riskScore
          )
        )
      : 0;


  const highestDepth =
    scenarios.length
      ? Math.max(
          ...scenarios.map(
            (s) =>
              s.maxDepth
          )
        )
      : 0;


  return (

    <main className="min-h-[calc(100vh-140px)] bg-[#07100f] p-8">


      {/* HEADER */}

      <div className="mb-8">

        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          System Analytics
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Flood Intelligence Dashboard
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Analyze scenario severity, propagation behavior,
          and operational risk across simulated flood conditions.
        </p>

      </div>


      {/* KPI CARDS */}

      <div className="mb-6 grid grid-cols-4 gap-4">

        <SummaryCard
          icon={
            <TrendingUp
              size={18}
            />
          }
          label="Highest Risk"
          value={
            scenarios.length
              ? `${highestRisk}/100`
              : "--"
          }
        />

        <SummaryCard
          icon={
            <Droplets
              size={18}
            />
          }
          label="Peak Depth"
          value={
            scenarios.length
              ? `${highestDepth} m`
              : "--"
          }
        />

        <SummaryCard
          icon={
            <GitCompare
              size={18}
            />
          }
          label="Scenarios"
          value={`${scenarios.length}`}
        />

        <SummaryCard
          icon={
            <BrainCircuit
              size={18}
            />
          }
          label="Decision Engine"
          value="Active"
        />

      </div>


      {loading ? (

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-[#0b1916]">

          <div className="text-center">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />

            <p className="text-sm text-slate-400">
              Generating analytics...
            </p>

          </div>

        </div>

      ) : (

        <>

          {/* CHARTS */}

          <div className="grid grid-cols-2 gap-5">


            {/* RISK CHART */}

            <ChartCard
              title="Risk Score Comparison"
              description="Composite risk across rainfall scenarios"
            >

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    domain={[
                      0,
                      100,
                    ]}
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1916",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      borderRadius:
                        "10px",
                      fontSize:
                        "12px",
                    }}
                  />

                  <Bar
                    dataKey="risk"
                    fill="#34d399"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </ChartCard>


            {/* FLOODED AREA */}

            <ChartCard
              title="Flooded Area"
              description="Spatial extent affected in each scenario"
            >

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1916",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      borderRadius:
                        "10px",
                      fontSize:
                        "12px",
                    }}
                  />

                  <Bar
                    dataKey="flooded"
                    fill="#22d3ee"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </ChartCard>


            {/* DEPTH */}

            <ChartCard
              title="Maximum Water Depth"
              description="Peak simulated depth by scenario"
            >

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1916",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      borderRadius:
                        "10px",
                      fontSize:
                        "12px",
                    }}
                  />

                  <Bar
                    dataKey="depth"
                    fill="#a78bfa"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </ChartCard>


            {/* TIME SERIES */}

            <ChartCard
              title="Propagation Over Time"
              description="Flooded cells and depth during the active simulation"
            >

              {timelineData.length >
              0 ? (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      timelineData
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0b1916",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius:
                          "10px",
                        fontSize:
                          "12px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="flooded"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex h-[300px] items-center justify-center">

                  <div className="text-center">

                    <Activity
                      size={28}
                      className="mx-auto mb-3 text-slate-700"
                    />

                    <p className="text-sm text-slate-500">
                      Run a live simulation to populate the timeline.
                    </p>

                  </div>

                </div>

              )}

            </ChartCard>

          </div>


          {/* INSIGHTS */}

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b1916] p-5">

            <div className="mb-5 flex items-center gap-2">

              <BrainCircuit
                size={17}
                className="text-emerald-400"
              />

              <div>

                <h3 className="text-sm font-semibold">
                  Automated Intelligence
                </h3>

                <p className="text-[11px] text-slate-600">
                  Interpreted from simulation outputs
                </p>

              </div>

            </div>


            <div className="grid grid-cols-3 gap-4">

              <Insight
                title="Rainfall Sensitivity"
                text={
                  "Higher rainfall scenarios produce a measurable increase in flood propagation and risk."
                }
              />

              <Insight
                title="Drainage Effect"
                text={
                  "Reduced drainage capacity increases water accumulation and overall operational risk."
                }
              />

              <Insight
                title="Priority Response"
                text={
                  "Critical infrastructure should receive priority monitoring when affected zones increase."
                }
              />

            </div>

          </div>

        </>

      )}

    </main>

  );
}


/* =========================================================
   SCENARIO LAB
========================================================= */

function ScenarioLab({
  scenarios,
  loading,
  onRefresh,
  onLoadScenario,
}: {
  scenarios: any[];
  loading: boolean;
  onRefresh: () => void;
  onLoadScenario: (scenario: any) => void;
}) {

  return (

    <main className="min-h-[calc(100vh-140px)] bg-[#07100f] p-8">

      <div className="mb-8 flex items-end justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Decision Intelligence
          </p>

          <h2 className="mt-2 text-3xl font-semibold">
            Scenario Lab
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Compare how environmental conditions change
            flood propagation and operational risk.
          </p>

        </div>


        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10"
        >

          <RotateCcw size={15} />

          Refresh Analysis

        </button>

      </div>


      {loading ? (

        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-white/10 bg-[#0b1916]">

          <div className="text-center">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />

            <p className="text-sm text-slate-400">
              Running scenario simulations...
            </p>

          </div>

        </div>

      ) : (

        <>

          <div className="grid grid-cols-3 gap-5">

            {scenarios.map(
              (
                scenario,
                index
              ) => (

                <ScenarioCard
                  key={
                    scenario.id
                  }
                  scenario={
                    scenario
                  }
                  index={
                    index
                  }
                  onLoad={onLoadScenario}
                />

              )
            )}

          </div>


          {scenarios.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
                <ChartCard
                  title="Risk progression"
                  description="How operational risk changes as rainfall intensity increases"
                  icon={<TrendingUp size={15} className="text-red-500" />}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scenarios.map((s: any) => ({
                        name: s.name || "Scenario",
                        risk: Number(s.riskScore ?? 0),
                      }))}
                      margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => [`${v}/100`, "Risk score"]} />
                      <Bar dataKey="risk" fill="#dc5a52" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Flood impact comparison"
                  description="Maximum depth and affected terrain across scenarios"
                  icon={<Waves size={15} className="text-cyan-600" />}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scenarios.map((s: any) => ({
                        name: s.name || "Scenario",
                        depth: Number(s.maxDepth ?? 0),
                        flooded: Number(s.floodedArea ?? 0),
                      }))}
                      margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="depth" fill="#1683a6" radius={[6, 6, 0, 0]} name="Max depth (m)" />
                      <Bar yAxisId="right" dataKey="flooded" fill="#2b9f8e" radius={[6, 6, 0, 0]} name="Flooded cells" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1916]">

              <div className="border-b border-white/10 px-5 py-4">

                <div className="flex items-center gap-2">

                  <GitCompare
                    size={16}
                    className="text-emerald-400"
                  />

                  <h3 className="text-sm font-semibold">
                    Comparative Analysis
                  </h3>

                </div>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full text-left text-xs">

                  <thead className="bg-white/[0.025]">

                    <tr>

                      <th className="px-5 py-4 text-slate-500">
                        Metric
                      </th>

                      {scenarios.map(
                        (
                          scenario
                        ) => (

                          <th
                            key={
                              scenario.id
                            }
                            className="px-5 py-4 text-slate-400"
                          >
                            {
                              scenario.name
                            }
                          </th>

                        )
                      )}

                    </tr>

                  </thead>


                  <tbody>

                    <ComparisonRow
                      label="Risk Score"
                      values={
                        scenarios.map(
                          (s) =>
                            `${s.riskScore}/100`
                        )
                      }
                      highlight
                    />

                    <ComparisonRow
                      label="Risk Level"
                      values={
                        scenarios.map(
                          (s) =>
                            s.riskLevel
                        )
                      }
                    />

                    <ComparisonRow
                      label="Maximum Depth"
                      values={
                        scenarios.map(
                          (s) =>
                            `${s.maxDepth} m`
                        )
                      }
                    />

                    <ComparisonRow
                      label="Flooded Area"
                      values={
                        scenarios.map(
                          (s) =>
                            `${s.floodedArea} cells`
                        )
                      }
                    />

                    <ComparisonRow
                      label="Earliest Arrival"
                      values={
                        scenarios.map(
                          (s) =>
                            `${s.earliestArrival ?? "--"} min`
                        )
                      }
                    />

                    <ComparisonRow
                      label="Critical Assets"
                      values={
                        scenarios.map(
                          (s) =>
                            `${s.criticalAssets}`
                        )
                      }
                    />

                  </tbody>

                </table>

              </div>

              </div>
            </>
          )}

        </>

      )}

    </main>
  );
}


/* =========================================================
   HISTORY PANEL
========================================================= */

function HistoryPanel({
  history,
  loading,
  error,
  onRefresh,
  onOpen,
  onDelete,
}: {
  history: any[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {

  const formatDate = (value: string) => {
    if (!value) return "Unknown date";

    return new Date(value).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const riskClass = (level: string) => {
    if (level === "CRITICAL") return "text-red-400 bg-red-400/10 border-red-400/20";
    if (level === "HIGH") return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    if (level === "MODERATE") return "text-amber-300 bg-amber-300/10 border-amber-300/20";
    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  };

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[#07100f] p-8">

      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Simulation Archive
          </p>

          <h2 className="mt-2 text-3xl font-semibold">
            Past Runs
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review, reopen, and manage previously executed flood propagation scenarios.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
          Refresh History
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-white/10 bg-[#0b1916]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
            <p className="text-sm text-slate-400">Loading simulation archive...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-400" size={24} />
          <h3 className="text-sm font-semibold text-slate-200">
            Unable to load history
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            {error}
          </p>
          <button
            onClick={onRefresh}
            className="mt-5 rounded-lg bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#06100e]"
          >
            Try Again
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1916] px-8 py-16 text-center">
          <History className="mx-auto mb-4 text-slate-600" size={28} />
          <h3 className="text-sm font-semibold text-slate-300">
            No saved simulations yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-600">
            Run a flood propagation scenario from Live Simulation and it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1916]">

          <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold">
                  Simulation Archive
                </span>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-slate-500">
                {history.length} {history.length === 1 ? "run" : "runs"}
              </span>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {history.map((item) => {
              const level = item.decision?.riskLevel || "LOW";
              const score = item.decision?.riskScore ?? 0;
              const rainfallValue = item.parameters?.rainfall ?? 0;
              const drainageValue = item.parameters?.drainageCapacity ?? 0;
              const depth = item.summary?.maxDepth ?? 0;
              const date = item.createdAt;

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group flex items-center gap-5 px-5 py-5 transition hover:bg-white/[0.025]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/5">
                    <Waves size={17} className="text-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate text-sm font-semibold text-slate-200">
                        {item.name || "Unnamed Scenario"}
                      </h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${riskClass(level)}`}>
                        {level}
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-600">
                      {formatDate(date)}
                    </p>
                  </div>

                  <div className="hidden items-center gap-7 xl:flex">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">Rainfall</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{rainfallValue} mm</p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">Drainage</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{drainageValue}%</p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">Max depth</p>
                      <p className="mt-1 text-xs font-medium text-slate-300">{depth} m</p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">Risk</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-400">{score}/100</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => onOpen(item._id)}
                      title="Open simulation"
                      className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[10px] font-medium text-emerald-300 transition hover:bg-emerald-400/10"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Open</span>
                    </button>

                    <button
                      onClick={() => onDelete(item._id, item.name || "Unnamed Scenario")}
                      title="Delete simulation"
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-500 transition hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}


/* =========================================================
   SCENARIO CARD
========================================================= */

function ScenarioCard({
  scenario,
  index,
  onLoad,
}: {
  scenario: any;
  index: number;
  onLoad: (scenario: any) => void;
}) {

  const riskClass =
    scenario.riskScore >= 75
      ? "text-red-400"
      : scenario.riskScore >= 55
      ? "text-orange-400"
      : "text-emerald-400";


  return (

    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          index * 0.1,
      }}
      className="rounded-2xl border border-white/10 bg-[#0b1916] p-5"
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Scenario {index + 1}
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            {scenario.name}
          </h3>

        </div>

        <span
          className={`rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold ${riskClass}`}
        >
          {scenario.riskLevel}
        </span>

      </div>


      <div className="mt-6">

        <p className="text-[10px] uppercase tracking-wider text-slate-600">
          Risk Score
        </p>

        <div
          className={`mt-1 text-4xl font-semibold ${riskClass}`}
        >

          {scenario.riskScore}

          <span className="text-base font-normal text-slate-600">
            /100
          </span>

        </div>

      </div>


      <div className="mt-6 grid grid-cols-2 gap-3">

        <ScenarioMetric
          label="Rainfall"
          value={`${scenario.rainfall ?? scenario.parameters?.rainfall ?? "--"} mm`}
        />

        <ScenarioMetric
          label="Drainage"
          value={`${scenario.drainageCapacity ?? scenario.parameters?.drainageCapacity ?? "--"}%`}
        />

        <ScenarioMetric
          label="Max Depth"
          value={`${scenario.maxDepth} m`}
        />

        <ScenarioMetric
          label="Flooded"
          value={`${scenario.floodedArea} cells`}
        />

        <ScenarioMetric
          label="Arrival"
          value={`${scenario.earliestArrival ?? "--"} min`}
        />

        <ScenarioMetric
          label="Assets"
          value={`${scenario.criticalAssets}`}
        />

      </div>

      <button
        type="button"
        onClick={() => onLoad(scenario)}
        className="flowmind-scenario-load mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
      >
        Load scenario
        <ArrowUpRight size={14} />
      </button>

    </motion.div>

  );
}


/* =========================================================
   CHART CARD
========================================================= */

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {

  return (

    <div className="flowmind-chart-card">

      <div className="flowmind-chart-header">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              {icon}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-900">
            {title}
          </h3>
        </div>

        <p className="mt-1 text-[11px] text-slate-500">
          {description}
        </p>
      </div>

      <div className="flowmind-chart-body">
        {children}
      </div>

    </div>

  );
}


/* =========================================================
   INSIGHT
========================================================= */

function Insight({
  title,
  text,
}: {
  title: string;
  text: string;
}) {

  return (

    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">

      <div className="flex items-center justify-between">

        <h4 className="text-xs font-semibold text-slate-300">
          {title}
        </h4>

        <ArrowUpRight
          size={14}
          className="text-emerald-400"
        />

      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {text}
      </p>

    </div>

  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-white/10 bg-[#0b1916] p-4">

      <div className="mb-3 text-emerald-400">
        {icon}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>

    </div>

  );
}


/* =========================================================
   COMPARISON ROW
========================================================= */

function ComparisonRow({
  label,
  values,
  highlight = false,
}: {
  label: string;
  values: string[];
  highlight?: boolean;
}) {

  return (

    <tr className="border-t border-white/5">

      <td className="px-5 py-4 text-slate-500">
        {label}
      </td>

      {values.map(
        (
          value,
          index
        ) => (

          <td
            key={index}
            className={`px-5 py-4 ${
              highlight
                ? "font-semibold text-emerald-400"
                : "text-slate-300"
            }`}
          >
            {value}
          </td>

        )
      )}

    </tr>

  );
}


/* =========================================================
   NAV BUTTON
========================================================= */

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {

  return (

    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${
        active
          ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
          : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
      }`}
    >

      {icon}

      {label}

    </button>

  );
}


/* =========================================================
   CONTROL
========================================================= */

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {

  return (

    <div className="mb-6">

      <div className="mb-2 flex justify-between">

        <label className="text-sm text-slate-300">
          {label}
        </label>

        <span className="text-sm font-semibold text-emerald-400">
          {value}
        </span>

      </div>

      {children}

    </div>

  );
}


/* =========================================================
   PARAMETER
========================================================= */

function Parameter({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="flex justify-between">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-slate-300">
        {value}
      </span>

    </div>

  );
}


/* =========================================================
   METRIC
========================================================= */

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">

      <div className="mb-2 text-emerald-400">
        {icon}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>

    </div>

  );
}


/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-white/10 bg-[#091513] px-4 py-3">

      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-300">
        {value}
      </p>

    </div>

  );
}


/* =========================================================
   SCENARIO METRIC
========================================================= */

function ScenarioMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">

      <p className="text-[9px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-300">
        {value}
      </p>

    </div>

  );
}


/* =========================================================
   RECOMMENDATION
========================================================= */

function Recommendation({
  text,
}: {
  text: string;
}) {

  return (

    <motion.div
      initial={{
        opacity: 0,
        y: 4,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-slate-400"
    >

      {text}

    </motion.div>

  );

}


export default App;
