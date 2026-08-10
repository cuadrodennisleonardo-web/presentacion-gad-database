import React, { useState } from "react";

export interface BarangayStatInfo {
  population?: number;
  households?: number;
}

interface PresentacionAdminMapProps {
  selectedBarangay?: string | null;
  onSelectBarangay?: (barangayName: string) => void;
  barangayStatsMap?: Record<string, BarangayStatInfo>;
  className?: string;
}

const BARANGAY_COORDS: Record<string, { x: number; y: number }> = {
  ayugao: { x: 435, y: 431 },
  bagongsirang: { x: 222, y: 325 },
  baliguian: { x: 822, y: 524 },
  bantugan: { x: 419, y: 214 },
  bicalen: { x: 558, y: 186 },
  bitaogan: { x: 928, y: 560 },
  buenavista: { x: 135, y: 289 },
  bulalacao: { x: 740, y: 479 },
  cagnipa: { x: 482, y: 474 },
  lagha: { x: 425, y: 490 },
  lidong: { x: 255, y: 129 },
  liwacsa: { x: 881, y: 549 },
  maangas: { x: 282, y: 389 },
  pagsangaan: { x: 601, y: 295 },
  patrocinio: { x: 180, y: 328 },
  pili: { x: 650, y: 419 },
  stamaria: { x: 546, y: 470 },
  tanawan: { x: 500, y: 355 },
};

export const PresentacionAdminMap: React.FC<PresentacionAdminMapProps> = ({
  selectedBarangay,
  onSelectBarangay,
  barangayStatsMap = {},
  className = "w-full h-auto",
}) => {
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);

  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

  const isSelected = (name: string) =>
    selectedBarangay ? normalize(selectedBarangay) === normalize(name) : false;

  const isHovered = (name: string) =>
    hoveredBarangay ? normalize(hoveredBarangay) === normalize(name) : false;

  const getShapeStyle = (name: string, defaultFill: string) => {
    const active = isSelected(name);
    const hovered = isHovered(name);

    if (active) {
      return {
        fill: "#2563eb",
        stroke: "#1d4ed8",
        strokeWidth: 4.5,
        fillOpacity: 0.95,
        cursor: "pointer",
        transition: "all 0.2s ease",
      };
    }

    if (hovered) {
      return {
        fill: defaultFill,
        stroke: "#1e293b",
        strokeWidth: 4.0,
        fillOpacity: 0.75,
        cursor: "pointer",
        transition: "all 0.15s ease",
      };
    }

    return {
      fill: defaultFill,
      stroke: "#ffffff",
      strokeWidth: 3.5,
      fillOpacity: 1.0,
      cursor: "pointer",
      transition: "all 0.15s ease",
    };
  };

  const handleBarangayClick = (name: string) => {
    if (onSelectBarangay) {
      onSelectBarangay(name);
    }
  };

  // Active target for Manhwa Speech Bubble Popover
  const activeBarangayName = hoveredBarangay || selectedBarangay;
  const activeKey = activeBarangayName ? normalize(activeBarangayName) : null;
  const activeCoords = activeKey ? BARANGAY_COORDS[activeKey] : null;

  // Find matching stats in barangayStatsMap (try normalized keys or exact keys)
  const activeStats = activeKey
    ? Object.entries(barangayStatsMap).find(
        ([key]) => normalize(key) === activeKey
      )?.[1]
    : null;

  return (
    <div className={`relative ${className}`}>
      {/* Unified Floating Hover & Active Barangay Badge Indicator */}
      {(hoveredBarangay || selectedBarangay) && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 rounded-xl bg-slate-900/90 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-slate-700">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {hoveredBarangay ? (
              <>Barangay: <span className="text-emerald-300 font-extrabold">{hoveredBarangay}</span></>
            ) : (
              <>Viewing: <span className="text-blue-300 font-extrabold">Barangay {selectedBarangay}</span></>
            )}
          </span>
          {selectedBarangay && onSelectBarangay && !hoveredBarangay && (
            <button
              type="button"
              onClick={() => onSelectBarangay("")}
              className="ml-2 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Reset Map View
            </button>
          )}
        </div>
      )}

      {/* MANHWA / COMIC SPEECH BUBBLE MODAL POPOVER */}
      {activeBarangayName && activeCoords && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-200 ease-out transform -translate-x-1/2 -translate-y-full -mt-4"
          style={{
            left: `${(activeCoords.x / 1024) * 100}%`,
            top: `${(activeCoords.y / 724) * 100}%`,
          }}
        >
          <div className="relative rounded-2xl bg-slate-900/95 text-white p-3.5 shadow-2xl border-2 border-brand-400 backdrop-blur-md min-w-[220px]">
            {/* Speech Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💬</span>
                <h4 className="text-xs font-black tracking-wide text-brand-300 uppercase">
                  Barangay {activeBarangayName}
                </h4>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">
                Demographics
              </span>
            </div>

            {/* Speech Content Stats */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Population</p>
                <p className="text-xs font-black text-emerald-400 mt-0.5">
                  {activeStats?.population !== undefined
                    ? activeStats.population.toLocaleString()
                    : "0"}
                </p>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Households</p>
                <p className="text-xs font-black text-blue-400 mt-0.5">
                  {activeStats?.households !== undefined
                    ? activeStats.households.toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>

            {/* Manhwa Speech Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-slate-900 border-r-2 border-b-2 border-brand-400 rotate-45" />
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 1024 724"
        xmlns="http://www.w3.org/2000/svg"
        fontFamily="'Segoe UI', Arial, Helvetica, sans-serif"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        className="w-full h-auto max-h-[650px] object-contain rounded-2xl bg-white"
      >
        <defs>
          <style>{`
            .brgy-text {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-weight: 700;
              pointer-events: none;
              user-select: none;
            }
            .mun-label {
              font-size: 11px;
              font-weight: 700;
              fill: #334155;
              font-style: italic;
              letter-spacing: 0.5px;
              pointer-events: none;
              user-select: none;
            }
            .coord-text {
              font-size: 8.5px;
              fill: #475569;
              font-family: Arial, sans-serif;
              pointer-events: none;
              user-select: none;
            }
            .legend-box {
              fill: #ffffff;
              stroke: #cbd5e1;
              stroke-width: 1.2;
              rx: 4px;
            }
            .legend-title {
              font-size: 11px;
              font-weight: 800;
              fill: #0f172a;
              letter-spacing: 0.5px;
            }
            .legend-text {
              font-size: 9.5px;
              fill: #334155;
            }
          `}</style>
        </defs>

        {/* Outer background */}
        <rect x="0" y="0" width="1024" height="724" fill="#ffffff" />
        <rect x="22" y="20" width="980" height="598" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />

        {/* Coordinates */}
        <g className="coord-text">
          <text x="133" y="14" textAnchor="middle">123.64°E</text>
          <text x="133" y="629" textAnchor="middle">123.64°E</text>
          <text x="312" y="14" textAnchor="middle">123.68°E</text>
          <text x="312" y="629" textAnchor="middle">123.68°E</text>
          <text x="491" y="14" textAnchor="middle">123.72°E</text>
          <text x="491" y="629" textAnchor="middle">123.72°E</text>
          <text x="670" y="14" textAnchor="middle">123.76°E</text>
          <text x="670" y="629" textAnchor="middle">123.76°E</text>
          <text x="849" y="14" textAnchor="middle">123.80°E</text>
          <text x="849" y="629" textAnchor="middle">123.80°E</text>
          <text x="990" y="14" textAnchor="middle">123.84°E</text>
          <text x="990" y="629" textAnchor="middle">123.84°E</text>

          <text x="12" y="58" textAnchor="middle" transform="rotate(-90 12 58)">13.80°N</text>
          <text x="1012" y="58" textAnchor="middle" transform="rotate(-90 1012 58)">13.80°N</text>
          <text x="12" y="175" textAnchor="middle" transform="rotate(-90 12 175)">13.76°N</text>
          <text x="1012" y="175" textAnchor="middle" transform="rotate(-90 1012 175)">13.76°N</text>
          <text x="12" y="292" textAnchor="middle" transform="rotate(-90 12 292)">13.72°N</text>
          <text x="1012" y="292" textAnchor="middle" transform="rotate(-90 1012 292)">13.72°N</text>
          <text x="12" y="409" textAnchor="middle" transform="rotate(-90 12 409)">13.68°N</text>
          <text x="1012" y="409" textAnchor="middle" transform="rotate(-90 1012 409)">13.68°N</text>
          <text x="12" y="526" textAnchor="middle" transform="rotate(-90 12 526)">13.64°N</text>
          <text x="1012" y="526" textAnchor="middle" transform="rotate(-90 1012 526)">13.64°N</text>
          <text x="12" y="605" textAnchor="middle" transform="rotate(-90 12 605)">13.60°N</text>
          <text x="1012" y="605" textAnchor="middle" transform="rotate(-90 1012 605)">13.60°N</text>
        </g>

        {/* Water Area */}
        <path
          d="M 22.0 618.0 L 1002.0 618.0 L 971.0 567.0 L 903.0 608.0 L 830.0 612.0 L 810.0 595.0 L 742.0 590.0 L 721.0 569.0 L 616.0 526.0 L 562.0 534.0 L 522.0 515.0 L 425.0 514.0 L 382.0 494.0 L 374.0 478.0 L 345.0 471.0 L 268.0 473.0 L 214.0 525.0 L 105.0 476.0 L 85.0 476.0 L 26.0 581.0 L 22.0 618.0 Z"
          fill="rgb(186,216,236)"
          stroke="none"
          pointerEvents="none"
        />

        {/* BARANGAY SHAPES WITH INTERACTIVE EVENTS */}
        <g className="barangay-group">
          {/* Ayugao */}
          <path
            id="brgy-ayugao"
            d="M 410.0 390.0 L 413.0 421.0 L 404.0 440.0 L 402.0 454.0 L 399.0 455.0 L 396.0 461.0 L 425.0 476.0 L 429.0 472.0 L 427.0 468.0 L 428.0 463.0 L 451.0 463.0 L 479.0 409.0 L 432.0 395.0 L 428.0 395.0 L 415.0 390.0 Z"
            style={getShapeStyle("Ayugao", "rgb(216,23,31)")}
            onClick={() => handleBarangayClick("Ayugao")}
            onMouseEnter={() => setHoveredBarangay("Ayugao")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Bagongsirang */}
          <path
            id="brgy-bagongsirang"
            d="M 226.0 172.0 L 167.0 499.0 L 179.0 511.0 L 198.0 517.0 L 187.0 476.0 L 282.0 249.0 Z"
            style={getShapeStyle("Bagongsirang", "rgb(223,61,41)")}
            onClick={() => handleBarangayClick("Bagongsirang")}
            onMouseEnter={() => setHoveredBarangay("Bagongsirang")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Baliguian */}
          <path
            id="brgy-baliguian"
            d="M 797.0 421.0 L 786.0 554.0 L 779.0 588.0 L 795.0 595.0 L 811.0 592.0 L 819.0 602.0 L 838.0 611.0 L 850.0 606.0 L 865.0 482.0 Z"
            style={getShapeStyle("Baliguian", "rgb(230,97,55)")}
            onClick={() => handleBarangayClick("Baliguian")}
            onMouseEnter={() => setHoveredBarangay("Baliguian")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Bantugan */}
          <path
            id="brgy-bantugan"
            d="M 448.0 49.0 L 423.0 65.0 L 408.0 97.0 L 283.0 247.0 L 408.0 384.0 L 513.0 249.0 L 502.0 152.0 L 538.0 109.0 Z"
            style={getShapeStyle("Bantugan", "rgb(238,133,82)")}
            onClick={() => handleBarangayClick("Bantugan")}
            onMouseEnter={() => setHoveredBarangay("Bantugan")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Bicalen */}
          <path
            id="brgy-bicalen"
            d="M 503.0 152.0 L 514.0 247.0 L 562.0 226.0 L 652.0 227.0 L 539.0 110.0 Z"
            style={getShapeStyle("Bicalen", "rgb(254,165,94)")}
            onClick={() => handleBarangayClick("Bicalen")}
            onMouseEnter={() => setHoveredBarangay("Bicalen")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Bitaogan */}
          <path
            id="brgy-bitaogan"
            d="M 925.0 515.0 L 921.0 515.0 L 920.0 521.0 L 918.0 523.0 L 892.0 585.0 L 892.0 591.0 L 894.0 593.0 L 896.0 601.0 L 901.0 605.0 L 910.0 601.0 L 914.0 596.0 L 919.0 593.0 L 933.0 592.0 L 940.0 585.0 L 942.0 576.0 L 947.0 571.0 L 958.0 572.0 L 962.0 565.0 L 972.0 565.0 L 967.0 556.0 L 966.0 550.0 L 959.0 534.0 L 945.0 525.0 L 928.0 518.0 Z"
            style={getShapeStyle("Bitaogan", "rgb(255,188,116)")}
            onClick={() => handleBarangayClick("Bitaogan")}
            onMouseEnter={() => setHoveredBarangay("Bitaogan")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Buenavista */}
          <path
            id="brgy-buenavista"
            d="M 190.0 147.0 L 118.0 207.0 L 118.0 215.0 L 98.0 236.0 L 85.0 239.0 L 77.0 258.0 L 84.0 288.0 L 104.0 323.0 L 139.0 344.0 L 128.0 382.0 L 133.0 390.0 L 122.0 396.0 L 123.0 423.0 L 119.0 427.0 L 130.0 430.0 L 133.0 449.0 L 114.0 446.0 L 108.0 457.0 L 87.0 471.0 L 106.0 473.0 L 128.0 486.0 L 143.0 424.0 Z"
            style={getShapeStyle("Buenavista", "rgb(253,210,136)")}
            onClick={() => handleBarangayClick("Buenavista")}
            onMouseEnter={() => setHoveredBarangay("Buenavista")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Bulalacao */}
          <path
            id="brgy-bulalacao"
            d="M 709.0 343.0 L 697.0 462.0 L 677.0 552.0 L 703.0 564.0 L 722.0 566.0 L 745.0 588.0 L 776.0 589.0 L 784.0 554.0 L 795.0 420.0 L 801.0 421.0 L 781.0 405.0 L 770.0 405.0 L 769.0 395.0 Z"
            style={getShapeStyle("Bulalacao", "rgb(255,228,159)")}
            onClick={() => handleBarangayClick("Bulalacao")}
            onMouseEnter={() => setHoveredBarangay("Bulalacao")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Cagnipa */}
          <path
            id="brgy-cagnipa"
            d="M 480.0 411.0 L 453.0 465.0 L 429.0 465.0 L 430.0 471.0 L 437.0 470.0 L 456.0 468.0 L 470.0 507.0 L 471.0 513.0 L 468.0 516.0 L 472.0 519.0 L 497.0 511.0 L 520.0 512.0 L 513.0 492.0 L 506.0 482.0 L 507.0 476.0 L 502.0 469.0 L 498.0 455.0 L 489.0 450.0 L 496.0 452.0 Z"
            style={getShapeStyle("Cagnipa", "rgb(255,246,180)")}
            onClick={() => handleBarangayClick("Cagnipa")}
            onMouseEnter={() => setHoveredBarangay("Cagnipa")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Lagha */}
          <path
            id="brgy-lagha"
            d="M 376.0 476.0 L 383.0 491.0 L 390.0 493.0 L 393.0 498.0 L 400.0 500.0 L 404.0 504.0 L 418.0 506.0 L 425.0 511.0 L 433.0 511.0 L 437.0 513.0 L 459.0 513.0 L 465.0 518.0 L 477.0 519.0 L 469.0 517.0 L 470.0 513.0 L 462.0 494.0 L 458.0 479.0 L 454.0 474.0 L 431.0 467.0 L 430.0 472.0 L 426.0 478.0 L 415.0 473.0 L 399.0 467.0 L 384.0 467.0 Z"
            style={getShapeStyle("Lagha", "rgb(245,251,186)")}
            onClick={() => handleBarangayClick("Lagha")}
            onMouseEnter={() => setHoveredBarangay("Lagha")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Lidong */}
          <path
            id="brgy-lidong"
            d="M 448.0 46.0 L 438.0 32.0 L 385.0 55.0 L 386.0 68.0 L 352.0 72.0 L 345.0 83.0 L 328.0 67.0 L 315.0 82.0 L 280.0 70.0 L 249.0 96.0 L 196.0 84.0 L 195.0 76.0 L 171.0 59.0 L 154.0 78.0 L 100.0 78.0 L 94.0 91.0 L 115.0 207.0 L 195.0 143.0 L 229.0 170.0 L 285.0 244.0 L 407.0 95.0 L 420.0 64.0 Z"
            style={getShapeStyle("Lidong", "rgb(227,242,185)")}
            onClick={() => handleBarangayClick("Lidong")}
            onMouseEnter={() => setHoveredBarangay("Lidong")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Liwacsa */}
          <path
            id="brgy-liwacsa"
            d="M 868.0 483.0 L 866.0 496.0 L 868.0 499.0 L 864.0 506.0 L 865.0 511.0 L 861.0 529.0 L 852.0 608.0 L 887.0 608.0 L 901.0 606.0 L 895.0 604.0 L 894.0 599.0 L 891.0 596.0 L 890.0 584.0 L 907.0 546.0 L 907.0 541.0 L 910.0 538.0 L 915.0 523.0 L 921.0 513.0 L 905.0 506.0 L 902.0 502.0 L 884.0 494.0 Z"
            style={getShapeStyle("Liwacsa", "rgb(207,235,174)")}
            onClick={() => handleBarangayClick("Liwacsa")}
            onMouseEnter={() => setHoveredBarangay("Liwacsa")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Maangas */}
          <path
            id="brgy-maangas"
            d="M 285.0 250.0 L 190.0 476.0 L 203.0 526.0 L 212.0 525.0 L 245.0 487.0 L 267.0 471.0 L 317.0 472.0 L 305.0 451.0 L 312.0 421.0 L 341.0 397.0 L 358.0 396.0 L 388.0 376.0 L 398.0 374.0 Z"
            style={getShapeStyle("Maangas", "rgb(187,226,167)")}
            onClick={() => handleBarangayClick("Maangas")}
            onMouseEnter={() => setHoveredBarangay("Maangas")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Pagsangaan */}
          <path
            id="brgy-pagsangaan"
            d="M 703.0 241.0 L 659.0 231.0 L 657.0 228.0 L 561.0 229.0 L 516.0 249.0 L 581.0 418.0 Z"
            style={getShapeStyle("Pagsangaan", "rgb(166,216,167)")}
            onClick={() => handleBarangayClick("Pagsangaan")}
            onMouseEnter={() => setHoveredBarangay("Pagsangaan")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Patrocinio */}
          <path
            id="brgy-patrocinio"
            d="M 196.0 146.0 L 133.0 487.0 L 163.0 501.0 L 171.0 477.0 L 225.0 169.0 Z"
            style={getShapeStyle("Patrocinio", "rgb(132,196,171)")}
            onClick={() => handleBarangayClick("Patrocinio")}
            onMouseEnter={() => setHoveredBarangay("Patrocinio")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Pili */}
          <path
            id="brgy-pili"
            d="M 702.0 245.0 L 580.0 420.0 L 588.0 433.0 L 571.0 435.0 L 571.0 469.0 L 583.0 490.0 L 595.0 490.0 L 605.0 497.0 L 611.0 523.0 L 583.0 524.0 L 567.0 534.0 L 545.0 529.0 L 543.0 523.0 L 536.0 524.0 L 524.0 514.0 L 542.0 529.0 L 570.0 535.0 L 592.0 523.0 L 616.0 524.0 L 673.0 552.0 L 695.0 453.0 L 707.0 345.0 Z"
            style={getShapeStyle("Pili", "rgb(101,175,177)")}
            onClick={() => handleBarangayClick("Pili")}
            onMouseEnter={() => setHoveredBarangay("Pili")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Sta. Maria */}
          <path
            id="brgy-sta-maria"
            d="M 409.0 386.0 L 484.0 409.0 L 524.0 513.0 L 534.0 522.0 L 569.0 534.0 L 589.0 522.0 L 610.0 523.0 L 604.0 497.0 L 595.0 491.0 L 583.0 491.0 L 569.0 466.0 L 570.0 435.0 L 575.0 433.0 L 583.0 436.0 L 587.0 433.0 L 577.0 414.0 L 577.0 420.0 L 486.0 409.0 L 413.0 388.0 L 413.0 382.0 Z"
            style={getShapeStyle("Sta. Maria", "rgb(72,152,177)")}
            onClick={() => handleBarangayClick("Sta. Maria")}
            onMouseEnter={() => setHoveredBarangay("Sta. Maria")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
          {/* Tanawan */}
          <path
            id="brgy-tanawan"
            d="M 513.0 252.0 L 410.0 386.0 L 486.0 408.0 L 577.0 420.0 L 570.0 396.0 Z"
            style={getShapeStyle("Tanawan", "rgb(44,131,184)")}
            onClick={() => handleBarangayClick("Tanawan")}
            onMouseEnter={() => setHoveredBarangay("Tanawan")}
            onMouseLeave={() => setHoveredBarangay(null)}
          />
        </g>

        {/* Barangay Text Labels */}
        <g className="brgy-text">
          <text x="434.7" y="431.3" fontSize="7.5" fill="#ffffff" stroke="#00000055" strokeWidth="2" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-73.4 434.7 431.3)">Ayugao</text>
          <text x="221.9" y="324.6" fontSize="12.5" fill="#ffffff" stroke="#00000055" strokeWidth="2" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-79.8 221.9 324.6)">Bagongsirang</text>
          <text x="822.1" y="524.4" fontSize="11.5" fill="#ffffff" stroke="#00000055" strokeWidth="2" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-83.8 822.1 524.4)">Baliguian</text>
          <text x="419.0" y="213.8" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-52.4 419.0 213.8)">Bantugan</text>
          <text x="558.1" y="186.2" fontSize="11.3" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-8.2 558.1 186.2)">Bicalen</text>
          <text x="928.5" y="559.8" fontSize="7.2" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-67.5 928.5 559.8)">Bitaogan</text>
          <text x="135.1" y="288.7" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-80.4 135.1 288.7)">Buenavista</text>
          <text x="739.8" y="478.9" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-81.3 739.8 478.9)">Bulalacao</text>
          <text x="481.6" y="474.3" fontSize="7.5" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(67.4 481.6 474.3)">Cagnipa</text>
          <text x="425.4" y="489.6" fontSize="7.5" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(9.9 425.4 489.6)">Lagha</text>
          <text x="255.1" y="128.8" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-5.8 255.1 128.8)">Lidong</text>
          <text x="881.2" y="548.6" fontSize="8.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-80.1 881.2 548.6)">Liwacsa</text>
          <text x="282.0" y="388.9" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-67.2 282.0 388.9)">Maangas</text>
          <text x="600.6" y="294.6" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-55.4 600.6 294.6)">Pagsangaan</text>
          <text x="179.6" y="328.0" fontSize="12.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-79.5 179.6 328.0)">Patrocinio</text>
          <text x="649.7" y="418.5" fontSize="13.0" fill="#16233d" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-77.5 649.7 418.5)">Pili</text>
          <text x="545.7" y="469.7" fontSize="10.5" fill="#ffffff" stroke="#00000055" strokeWidth="2" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(47.8 545.7 469.7)">Sta. Maria</text>
          <text x="500.3" y="354.8" fontSize="13.0" fill="#ffffff" stroke="#00000055" strokeWidth="2" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle" letterSpacing="0.3" transform="rotate(-52.5 500.3 354.8)">Tanawan</text>
        </g>

        {/* Static Neighboring Municipalities Labels */}
        <g className="mun-label">
          <text x="310" y="38" textAnchor="middle">MUNICIPALITY OF GARCHITORENA</text>
          <text x="38" y="300" textAnchor="middle" transform="rotate(-90 38 300)">MUNICIPALITY OF LAGONOY</text>
          <text x="660" y="145" textAnchor="middle" transform="rotate(38 660 145)">MUNICIPALITY OF CARAMOAN</text>
        </g>

        {/* Lagonoy Gulf Label */}
        <text x="440" y="565" textAnchor="middle" fontSize="14px" fontWeight="800" fill="#1e3a8a" letterSpacing="1px" pointerEvents="none">LAGONOY GULF</text>

        {/* Legend Box */}
        <g transform="translate(775, 32)" pointerEvents="none">
          <rect className="legend-box" x="0" y="0" width="220" height="345" />
          <text className="legend-title" x="12" y="22">LEGENDS:</text>

          <rect x="12" y="32" width="24" height="8" fill="rgb(186,216,236)" />
          <text className="legend-text" x="42" y="39">Water Boundary</text>

          <line x1="12" y1="52" x2="208" y2="52" stroke="#e2e8f0" strokeWidth="1" />

          <text className="legend-title" x="12" y="68">Barangay</text>

          <rect x="12" y="78" width="20" height="9" fill="rgb(216,23,31)" rx="1" /><text className="legend-text" x="38" y="85.5">Ayugao</text>
          <rect x="12" y="92" width="20" height="9" fill="rgb(223,61,41)" rx="1" /><text className="legend-text" x="38" y="99.5">Bagongsirang</text>
          <rect x="12" y="106" width="20" height="9" fill="rgb(230,97,55)" rx="1" /><text className="legend-text" x="38" y="113.5">Baliguian</text>
          <rect x="12" y="120" width="20" height="9" fill="rgb(238,133,82)" rx="1" /><text className="legend-text" x="38" y="127.5">Bantugan</text>
          <rect x="12" y="134" width="20" height="9" fill="rgb(254,165,94)" rx="1" /><text className="legend-text" x="38" y="141.5">Bicalen</text>
          <rect x="12" y="148" width="20" height="9" fill="rgb(255,188,116)" rx="1" /><text className="legend-text" x="38" y="155.5">Bitaogan</text>
          <rect x="12" y="162" width="20" height="9" fill="rgb(253,210,136)" rx="1" /><text className="legend-text" x="38" y="169.5">Buenavista</text>
          <rect x="12" y="176" width="20" height="9" fill="rgb(255,228,159)" rx="1" /><text className="legend-text" x="38" y="183.5">Bulalacao</text>
          <rect x="12" y="190" width="20" height="9" fill="rgb(255,246,180)" rx="1" /><text className="legend-text" x="38" y="197.5">Cagnipa</text>
          <rect x="12" y="204" width="20" height="9" fill="rgb(245,251,186)" rx="1" /><text className="legend-text" x="38" y="211.5">Lagha</text>
          <rect x="12" y="218" width="20" height="9" fill="rgb(227,242,185)" rx="1" /><text className="legend-text" x="38" y="225.5">Lidong</text>
          <rect x="12" y="232" width="20" height="9" fill="rgb(207,235,174)" rx="1" /><text className="legend-text" x="38" y="239.5">Liwacsa</text>
          <rect x="12" y="246" width="20" height="9" fill="rgb(187,226,167)" rx="1" /><text className="legend-text" x="38" y="253.5">Maangas</text>
          <rect x="12" y="260" width="20" height="9" fill="rgb(166,216,167)" rx="1" /><text className="legend-text" x="38" y="267.5">Pagsangaan</text>
          <rect x="12" y="274" width="20" height="9" fill="rgb(132,196,171)" rx="1" /><text className="legend-text" x="38" y="281.5">Patrocinio</text>
          <rect x="12" y="288" width="20" height="9" fill="rgb(101,175,177)" rx="1" /><text className="legend-text" x="38" y="295.5">Pili</text>
          <rect x="12" y="302" width="20" height="9" fill="rgb(72,152,177)" rx="1" /><text className="legend-text" x="38" y="309.5">Sta. Maria</text>
          <rect x="12" y="316" width="20" height="9" fill="rgb(44,131,184)" rx="1" /><text className="legend-text" x="38" y="323.5">Tanawan</text>
        </g>

        {/* Bottom Footer Grid */}
        <g transform="translate(22, 634)">
          <rect x="0" y="0" width="980" height="78" fill="#ffffff" stroke="#475569" strokeWidth="1.4" />

          <line x1="270" y1="0" x2="270" y2="78" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="540" y1="0" x2="540" y2="78" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="740" y1="0" x2="740" y2="78" stroke="#cbd5e1" strokeWidth="1.2" />

          {/* LGU Header */}
          <g transform="translate(14, 8)">
            <circle cx="26" cy="31" r="22" fill="#f8fafc" stroke="#1e40af" strokeWidth="1.8" />
            <circle cx="26" cy="31" r="18" fill="none" stroke="#1e40af" strokeWidth="0.8" />
            <text x="26" y="35" fontSize="9.5px" textAnchor="middle" fill="#1e40af" fontWeight="800">MP</text>

            <text x="56" y="20" fontSize="11.5px" fontWeight="800" fill="#1e40af" letterSpacing="0.5px">MUNICIPALITY OF</text>
            <text x="56" y="36" fontSize="14.5px" fontWeight="900" fill="#1e40af" letterSpacing="0.8px">PRESENTACION</text>
            <text x="56" y="50" fontSize="8px" fontWeight="600" fill="#475569">PROVINCE OF CAMARINES SUR</text>
            <text x="56" y="60" fontSize="8px" fontWeight="600" fill="#475569">REGION V</text>
          </g>

          {/* Map Title */}
          <g transform="translate(405, 40)">
            <text x="0" y="-6" fontSize="17px" fontWeight="900" textAnchor="middle" fill="#0f172a" letterSpacing="1px">ADMINISTRATIVE</text>
            <text x="0" y="16" fontSize="17px" fontWeight="900" textAnchor="middle" fill="#0f172a" letterSpacing="1px">MAP</text>
          </g>

          {/* Compass */}
          <g transform="translate(640, 16)">
            <circle cx="0" cy="20" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
            <polygon points="0,10 -5,22 0,19 5,22" fill="#0f172a" />
            <polygon points="0,10 0,19 5,22" fill="#64748b" />
            <text x="0" y="44" fontSize="8.5px" fontWeight="800" textAnchor="middle" fill="#0f172a">N</text>
          </g>

          {/* Source Info */}
          <g transform="translate(755, 10)">
            <text x="0" y="10" fontSize="7.5px" fontWeight="700" fill="#475569">Source:</text>
            <text x="0" y="20" fontSize="7.5px" fontWeight="600" fill="#0f172a">Municipal Planning &amp; Dev't Office (MPDO)</text>
            <text x="0" y="34" fontSize="7.5px" fontWeight="700" fill="#475569">Prepared From:</text>
            <text x="0" y="44" fontSize="7.5px" fontWeight="600" fill="#0f172a">Municipal Planning &amp; Dev't Office (MPDO)</text>
            <line x1="0" y1="51" x2="210" y2="51" stroke="#e2e8f0" strokeWidth="0.8" />
            <text x="0" y="61" fontSize="7px" fontWeight="600" fill="#64748b">WGS 84 : EPSG 4326</text>
          </g>
        </g>
      </svg>
    </div>
  );
};
