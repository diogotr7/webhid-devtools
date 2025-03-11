import React, { useState } from "react";
import { prettyTime, toHexString } from "../utils";
import { useWebHidMonitor } from "../hooks/useWebHidMonitor";

export function DevTools() {
  const { packets, clearPackets } = useWebHidMonitor();
  const [selectedPacket, setSelectedPacket] = useState<any>(null);
  const [filterText, setFilterText] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    incoming: true,
    outgoing: true,
    device: true,
    request: true,
  });

  // Filter packets based on filterText and filterOptions
  const filteredPackets = packets.filter((packet) => {
    // Text filter
    const matchesText = filterText
      ? packet.eventType.toLowerCase().includes(filterText.toLowerCase()) ||
        (packet.data?.device?.productName &&
          packet.data.device.productName
            .toLowerCase()
            .includes(filterText.toLowerCase()))
      : true;

    // Type filter
    const type = packet.eventType.split(":")[0];
    let matchesType = true;

    if (type.startsWith("incoming") && !filterOptions.incoming)
      matchesType = false;
    else if (type.startsWith("outgoing") && !filterOptions.outgoing)
      matchesType = false;
    else if (type.startsWith("device") && !filterOptions.device)
      matchesType = false;
    else if (type.startsWith("request") && !filterOptions.request)
      matchesType = false;

    return matchesText && matchesType;
  });

  // Handle row click to select a packet
  const handleRowClick = (packet: any) => {
    setSelectedPacket(packet);
  };

  // Get icon for event type
  const getEventTypeIcon = (eventType: string) => {
    if (eventType.startsWith("outgoing")) {
      return "⬆️";
    } else if (eventType.startsWith("incoming")) {
      return "⬇️";
    } else if (eventType.startsWith("device")) {
      return "🔌";
    } else if (eventType.startsWith("request")) {
      return "🔍";
    }
    return "ℹ️";
  };

  // Get short name for event type
  const getEventTypeShortName = (eventType: string) => {
    if (eventType.startsWith("outgoing:report")) return "OUT";
    if (eventType.startsWith("incoming:report")) return "IN";
    if (eventType.startsWith("outgoing:featureReport")) return "OUT FEAT";
    if (eventType.startsWith("incoming:featureReport")) return "IN FEAT";
    if (eventType.startsWith("device:connect")) return "CONNECT";
    if (eventType.startsWith("device:disconnect")) return "DISCONNECT";
    if (eventType.startsWith("device:open")) return "OPEN";
    if (eventType.startsWith("device:close")) return "CLOSE";
    if (eventType.startsWith("request")) return "REQ";

    // Default: return last part of event type
    const parts = eventType.split(":");
    return parts[parts.length - 1].toUpperCase();
  };

  // Get color style for event types
  const getEventTypeStyle = (eventType: string) => {
    if (eventType.startsWith("outgoing")) {
      return { color: "#8ab4f8" }; // Blue for outgoing
    } else if (eventType.startsWith("incoming")) {
      return { color: "#81c995" }; // Green for incoming
    } else if (eventType.startsWith("device")) {
      return { color: "#fdd663" }; // Yellow for device events
    } else if (eventType.startsWith("request")) {
      return { color: "#c58af9" }; // Purple for request events
    }
    return { color: "#bdc1c6" }; // Default color
  };

  // State for the resizer
  const [splitPosition, setSplitPosition] = useState(60); // Default split at 60%
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse down on the resizer
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle mouse move to resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const containerWidth = window.innerWidth;
        const newPosition = (e.clientX / containerWidth) * 100;
        // Limit the range to prevent panels from getting too small
        if (newPosition > 20 && newPosition < 80) {
          setSplitPosition(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#202124",
        color: "#e8eaed",
        height: "100vh",
        width: "100%",
        margin: 0,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        fontSize: "12px",
        boxSizing: "border-box",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "1px solid #3c4043",
          backgroundColor: "#292a2d",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={clearPackets}
            style={{
              padding: "5px 10px",
              marginRight: "8px",
              backgroundColor: "#3c4043",
              border: "none",
              borderRadius: "4px",
              color: "#e8eaed",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Clear
          </button>
          <input
            type="text"
            placeholder="Filter"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              padding: "5px 10px",
              backgroundColor: "#3c4043",
              border: "none",
              borderRadius: "4px",
              color: "#e8eaed",
              fontSize: "11px",
              width: "200px",
              marginRight: "12px",
            }}
          />

          {/* Filter checkboxes */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: "8px",
                fontSize: "11px",
                color: "#8ab4f8",
              }}
            >
              <input
                type="checkbox"
                checked={filterOptions.outgoing}
                onChange={() =>
                  setFilterOptions({
                    ...filterOptions,
                    outgoing: !filterOptions.outgoing,
                  })
                }
                style={{ marginRight: "4px" }}
              />
              OUT
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: "8px",
                fontSize: "11px",
                color: "#81c995",
              }}
            >
              <input
                type="checkbox"
                checked={filterOptions.incoming}
                onChange={() =>
                  setFilterOptions({
                    ...filterOptions,
                    incoming: !filterOptions.incoming,
                  })
                }
                style={{ marginRight: "4px" }}
              />
              IN
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: "8px",
                fontSize: "11px",
                color: "#fdd663",
              }}
            >
              <input
                type="checkbox"
                checked={filterOptions.device}
                onChange={() =>
                  setFilterOptions({
                    ...filterOptions,
                    device: !filterOptions.device,
                  })
                }
                style={{ marginRight: "4px" }}
              />
              DEV
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: "8px",
                fontSize: "11px",
                color: "#c58af9",
              }}
            >
              <input
                type="checkbox"
                checked={filterOptions.request}
                onChange={() =>
                  setFilterOptions({
                    ...filterOptions,
                    request: !filterOptions.request,
                  })
                }
                style={{ marginRight: "4px" }}
              />
              REQ
            </label>
          </div>
        </div>
      </div>

      {/* Main content area - split view */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Packet list */}
        <div
          style={{
            width: `${splitPosition}%`,
            overflowY: "auto",
            borderRight: "none",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#292a2d" }}>
                <th
                  style={{
                    padding: "5px",
                    textAlign: "left",
                    fontWeight: "500",
                    borderBottom: "1px solid #3c4043",
                    color: "#bdc1c6",
                    position: "sticky",
                    top: 0,
                    background: "#292a2d",
                    fontSize: "11px",
                    width: "90px",
                  }}
                >
                  Time
                </th>
                <th
                  style={{
                    padding: "5px",
                    textAlign: "center",
                    fontWeight: "500",
                    borderBottom: "1px solid #3c4043",
                    color: "#bdc1c6",
                    position: "sticky",
                    top: 0,
                    background: "#292a2d",
                    fontSize: "11px",
                    width: "30px",
                  }}
                >
                  I/O
                </th>
                <th
                  style={{
                    padding: "5px",
                    textAlign: "left",
                    fontWeight: "500",
                    borderBottom: "1px solid #3c4043",
                    color: "#bdc1c6",
                    position: "sticky",
                    top: 0,
                    background: "#292a2d",
                    fontSize: "11px",
                    width: "80px",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: "5px",
                    textAlign: "left",
                    fontWeight: "500",
                    borderBottom: "1px solid #3c4043",
                    color: "#bdc1c6",
                    position: "sticky",
                    top: 0,
                    background: "#292a2d",
                    fontSize: "11px",
                    width: "40px",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: "5px",
                    textAlign: "left",
                    fontWeight: "500",
                    borderBottom: "1px solid #3c4043",
                    color: "#bdc1c6",
                    position: "sticky",
                    top: 0,
                    background: "#292a2d",
                    fontSize: "11px",
                  }}
                >
                  Device
                </th>
                <th
                  style={{
                    padding: "5px",
                    textAlign: "left",
                    fontWeight: "500",
                    borderBottom: "1px solid #3c4043",
                    color: "#bdc1c6",
                    position: "sticky",
                    top: 0,
                    background: "#292a2d",
                    fontSize: "11px",
                  }}
                >
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPackets.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#9aa0a6",
                    }}
                  >
                    No packets captured yet. Use WebHID API in the page to see
                    packets.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((packet: any, index: number) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #3c4043",
                      backgroundColor:
                        selectedPacket === packet
                          ? "#3c4043"
                          : index % 2 === 0
                          ? "#202124"
                          : "#292a2d",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRowClick(packet)}
                  >
                    <td
                      style={{
                        padding: "4px 5px",
                        color: "#bdc1c6",
                        fontSize: "11px",
                      }}
                    >
                      {prettyTime(packet.timestamp)}
                    </td>
                    <td
                      style={{
                        padding: "4px 5px",
                        textAlign: "center",
                        fontSize: "11px",
                      }}
                    >
                      {getEventTypeIcon(packet.eventType)}
                    </td>
                    <td
                      style={{
                        padding: "4px 5px",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        ...getEventTypeStyle(packet.eventType),
                      }}
                    >
                      {getEventTypeShortName(packet.eventType)}
                    </td>
                    <td
                      style={{
                        padding: "4px 5px",
                        color: "#bdc1c6",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        textAlign: "center",
                      }}
                    >
                      {packet.data?.reportId !== undefined
                        ? packet.data.reportId
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "4px 5px",
                        color: "#bdc1c6",
                        fontSize: "11px",
                      }}
                    >
                      {packet.data?.device?.productName || "—"}
                    </td>
                    <td
                      style={{
                        padding: "4px 5px",
                        color: "#bdc1c6",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {packet.data?.data
                        ? toHexString(packet.data.data).substring(0, 35) +
                          (packet.data.data.length > 12 ? "..." : "")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resizer */}
        <div
          style={{
            width: "6px",
            cursor: "col-resize",
            backgroundColor: isDragging ? "#4285f4" : "#3c4043",
            zIndex: 10,
          }}
          onMouseDown={handleMouseDown}
        />

        {/* Details panel */}
        <div
          style={{
            width: `${100 - splitPosition}%`,
            overflowY: "auto",
            padding: "12px",
            backgroundColor: "#292a2d",
          }}
        >
          {selectedPacket ? (
            <div>
              <h3 style={{ margin: "0 0 12px 0", color: "#e8eaed" }}>
                {selectedPacket.eventType}
              </h3>

              {/* Timestamp */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#9aa0a6", marginBottom: "4px" }}>
                  Timestamp
                </div>
                <div style={{ color: "#e8eaed" }}>
                  {new Date(selectedPacket.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Device info if available */}
              {selectedPacket.data?.device && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9aa0a6", marginBottom: "4px" }}>
                    Device
                  </div>
                  <div style={{ color: "#e8eaed" }}>
                    <div>
                      {selectedPacket.data.device.productName ||
                        "Unknown device"}
                    </div>
                    <div>
                      Vendor ID: 0x
                      {selectedPacket.data.device.vendorId
                        ?.toString(16)
                        .padStart(4, "0") || "—"}
                    </div>
                    <div>
                      Product ID: 0x
                      {selectedPacket.data.device.productId
                        ?.toString(16)
                        .padStart(4, "0") || "—"}
                    </div>
                  </div>
                </div>
              )}

              {/* Report data if available */}
              {selectedPacket.data?.data && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#9aa0a6", marginBottom: "4px" }}>
                    Data
                  </div>
                  <div>
                    <div style={{ marginBottom: "4px", color: "#e8eaed" }}>
                      {selectedPacket.data.reportId !== undefined
                        ? `Report ID: ${selectedPacket.data.reportId}`
                        : ""}
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        color: "#e8eaed",
                        backgroundColor: "#202124",
                        padding: "8px",
                        borderRadius: "4px",
                        overflowX: "auto",
                      }}
                    >
                      {selectedPacket.data.data
                        ? toHexString(selectedPacket.data.data)
                        : "No data"}
                    </pre>
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              <div>
                <div style={{ color: "#9aa0a6", marginBottom: "4px" }}>
                  Raw packet data
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#e8eaed",
                    backgroundColor: "#202124",
                    padding: "8px",
                    borderRadius: "4px",
                    overflowX: "auto",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {JSON.stringify(selectedPacket.data, null, 2) || "{}"}
                </pre>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                color: "#9aa0a6",
              }}
            >
              Select a packet to view details
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: "6px 12px",
          borderTop: "1px solid #3c4043",
          backgroundColor: "#292a2d",
          fontSize: "11px",
          color: "#9aa0a6",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>{filteredPackets.length} packets</div>
        <div>
          {filterText &&
            `Filter: "${filterText}" - ${filteredPackets.length} results`}
        </div>
      </div>
    </div>
  );
}
