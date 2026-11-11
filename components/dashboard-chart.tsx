"use client";
import { useState } from "react";
import { ChartNoAxesColumn } from "lucide-react";
export type DashboardPoint = {
  date: string;
  label: string;
  volume: string;
  count: string;
  volumeHeight: number;
  countHeight: number;
};
export function DashboardChart({
  points,
  volumeAxis,
  countAxis,
  hasData,
}: {
  points: DashboardPoint[];
  volumeAxis: string[];
  countAxis: string[];
  hasData: boolean;
}) {
  const [mode, setMode] = useState<"volume" | "count">("volume");
  const axis = mode === "volume" ? volumeAxis : countAxis;
  const hasValues = points.some((point) =>
    mode === "volume" ? point.volumeHeight > 0 : point.countHeight > 0,
  );
  return (
    <section className="dashboard-card dashboard-chart">
      <header className="dashboard-card-heading">
        <h2>To‘lovlar faolligi</h2>
        <div
          className="dashboard-chart-switch"
          role="group"
          aria-label="Grafik ko‘rsatkichi"
        >
          <button
            type="button"
            aria-pressed={mode === "volume"}
            onClick={() => setMode("volume")}
          >
            Hajm
          </button>
          <button
            type="button"
            aria-pressed={mode === "count"}
            onClick={() => setMode("count")}
          >
            Soni
          </button>
        </div>
      </header>
      <div
        className="dashboard-plot"
        role="group"
        aria-label={
          mode === "volume"
            ? "Muvaffaqiyatli to‘lovlar hajmi, UZS"
            : "Barcha tranzaksiyalar soni"
        }
      >
        <div className="dashboard-y-axis" aria-hidden="true">
          {axis.map((value, index) => (
            <span key={index}>
              {hasValues || index === axis.length - 1 ? value : ""}
            </span>
          ))}
        </div>
        <div className="dashboard-plot-area">
          <div className="dashboard-gridlines" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="dashboard-bars">
            {points.map((point, index) => {
              const value =
                mode === "volume" ? `${point.volume} UZS` : `${point.count} ta`;
              return (
                <div className="dashboard-bar-slot" key={point.date}>
                  <button
                    type="button"
                    className="dashboard-bar-target"
                    aria-label={`${point.date}: ${value}`}
                  >
                    <span
                      className="dashboard-bar"
                      style={{
                        height: `${mode === "volume" ? point.volumeHeight : point.countHeight}%`,
                      }}
                    />
                    <span className="dashboard-bar-tooltip">
                      {point.date}
                      <strong>{value}</strong>
                    </span>
                  </button>
                  <span className="dashboard-x-label" aria-hidden="true">
                    {points.length <= 7 ||
                    index === 0 ||
                    index === points.length - 1 ||
                    index % Math.ceil(points.length / 6) === 0
                      ? point.label
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
          {!hasValues && (
            <div className="dashboard-chart-empty">
              <ChartNoAxesColumn size={27} aria-hidden="true" />
              <p>
                {hasData && mode === "volume"
                  ? "Muvaffaqiyatli to‘lovlar yo‘q"
                  : "Ma’lumotlar shu yerda ko‘rinadi"}
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="dashboard-chart-caption">
        {mode === "volume"
          ? "Muvaffaqiyatli to‘lovlar · UZS"
          : "Barcha holatlar · tranzaksiyalar soni"}{" "}
        · Toshkent vaqti
      </p>
    </section>
  );
}
