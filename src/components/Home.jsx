import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AddFactorModal from "./AddFactorModal.js";
import ModelVisualization from "./ModelVisualization.js";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as joint from "jointjs";
import styled from "styled-components";
import LinkModal from "./LinkModal.js";
import Chart from "chart.js/auto";
import "chartjs-plugin-dragdata";
import ChartDataLabels from "chartjs-plugin-dragdata";
import PopoverChart from "./PopoverChart.js";
import ChartComponent from "./ChartComponent";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Modal,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useAuth } from "../context/AuthContext";

const HomeContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const Column = styled.div`
  padding: 10px;
  background-color: #f4f4f4;
`;

const LeftColumn = styled(Column)`
  width: 25%;
`;

const MiddleColumn = styled(Column)`
  width: 50%;
  display: flex;
  flex-direction: column;
`;

const RightColumn = styled(Column)`
  width: 25%;
`;

const SectionContainer = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const SearchBar = styled.div`
  display: flex;
  margin-bottom: 10px;

  input {
    flex: 1;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ddd;
  }

  button {
    padding: 10px 20px;
    border: none;
    background-color: #60396e;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
  }
`;

const PredictionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  button {
    padding: 8px 10px;
    border: none;
    background-color: #512da8;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }
  }
`;

const FactorGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  gap: 4px;
`;

const FactorItem = styled.div`
  background-color: #60396e;
  padding: 5px 10px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.2s;
  color: white;
  font-size: 12px;

  &:hover {
    transform: scale(1.05);
  }
`;

const DragDropArea = styled.div`
  flex-grow: 1;
  border: 2px dashed #ddd;
  border-radius: 10px;
  padding: 20px;
  min-height: 200px;
`;

const ModelActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModelNameInput = styled.input`
  flex: 1;
  padding: 8px;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
`;

const CustomButton = styled.button`
  padding: 8px 15px;
  border: none;
  background-color: #60396e;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 5px;
`;

const DeleteButton = styled.button`
  padding: 8px 15px;
  border: none;
  // background-color: #512da8;
  background-color: #ff4d4d;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 5px;
`;

// export const DeleteButton = styled.span`
//   color: #f44336;
//   margin-left: 5px;
//   cursor: pointer;
// `;

const Home = () => {
  const [modelName, setModelName] = useState("");
  const [modelQuality, setModelQuality] = useState("Not trained yet");
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [targetVariables, setTargetVariables] = useState([]);
  const [adminFactors, setAdminFactors] = useState([]);
  const [userFactors, setUserFactors] = useState([]);
  const [modelLevels, setModelLevels] = useState([]);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showAddFactorModal, setShowAddFactorModal] = useState(false);
  const [lastRectPosition, setLastRectPosition] = useState({ x: 50, y: 50 });
  const [selectedModel, setSelectedModel] = useState(null);
  const [openPopovers, setOpenPopovers] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [sourceElement, setSourceElement] = React.useState(null);
  const [sourcePort, setSourcePort] = React.useState(null);

  const openAddFactorModal = () => setShowAddFactorModal(true);
  const closeAddFactorModal = () => setShowAddFactorModal(false);
  const [newFactor, setNewFactor] = useState({
    name: "",
    description: "",
    timeSeries: new Array(25).fill(null),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFactors, setFilteredFactors] = useState([]);

  const graphRef = useRef(null);
  const paperRef = useRef(null);
  const [selectedElements, setSelectedElements] = React.useState([]);
  const linkModal = new LinkModal();
  const [selectedFactorData, setSelectedFactorData] = useState(null);
  const [isChartVisible, setIsChartVisible] = useState(false);

  useEffect(() => {
    loadTargets();
    loadFactors();
    loadModels();
    const graph = new joint.dia.Graph();

    const paper = new joint.dia.Paper({
      el: graphRef.current,
      model: graph,
      width: "100%",
      height: "100%",
      gridSize: 10,
      drawGrid: true,
      interactive: { linkMove: true },
      cellViewNamespace: joint.shapes,
      linkPinning: false,
      defaultLink: () =>
        new joint.shapes.standard.Link({
          attrs: {
            wrapper: {
              cursor: "default",
            },
            line: {
              stroke: "black",
              strokeWidth: 2,
            },
          },
          markup: [
            {
              tagName: "path",
              selector: "wrapper",
              attributes: {
                fill: "none",
                cursor: "pointer",
                stroke: "transparent",
                strokeWidth: 10,
              },
            },
            {
              tagName: "path",
              selector: "line",
              attributes: {
                fill: "none",
                stroke: "black",
                strokeWidth: 2,
              },
            },
          ],
        }),
      defaultConnectionPoint: { name: "boundary" },
      validateConnection: function (
        cellViewS,
        magnetS,
        cellViewT,
        magnetT,
        end,
        linkView
      ) {
        return magnetS !== magnetT;
      },
    });

    // Enable element deletion on right-click
    paper.on("element:contextmenu", (elementView, evt) => {
      evt.preventDefault();
      elementView.model.remove();
    });

    // // Enable link deletion on right-click
    paper.on("link:contextmenu", (linkView, evt) => {
      evt.preventDefault();
      linkView.model.remove();
    });

    paper.on("link:mouseenter", (linkView) => {
      showLinkTools(linkView);
    });

    paper.on("link:mouseleave", (linkView) => {
      linkView.removeTools();
    });

    paper.on("cell:pointerclick", (cellView) => {
      const element = cellView.model;

      if (element.isElement()) {
        // const factor = element.attr("label/text"); // Retrieve factor name from label
        const factor = element.get("factor"); // Assuming time series data is stored in model attributes

        handleOpenPopover(factor);
      }
    });

    graphRef.current.graph = graph;
  }, []);

  const handleOpenPopover = (componentData) => {
    const newPopover = {
      id: componentData.id,
      componentData: componentData,
      position: getComponentPosition(componentData), // You can define this function based on your layout
    };
    setOpenPopovers((prev) => [...prev, newPopover]); // Add new popover to state
    setSelectedData(componentData); // Set data for chart
  };

  // Function to close a specific popover
  const handleClosePopover = (popoverId) => {
    setOpenPopovers((prev) => prev.filter((p) => p.id !== popoverId));
  };

  const getComponentPosition = (component) => {
    const position = component.position();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let xPosition = position.x + 200; // Adjust based on your layout
    let yPosition = position.y + 100;

    if (xPosition + 400 > screenWidth) xPosition -= 400;
    if (yPosition + 400 > screenHeight) yPosition -= 400;

    return { x: xPosition, y: yPosition };
  };

  const handleAddSuccess = () => {
    console.log("Factor added to the system.");
    // Update any additional state if needed.
  };

  const handleVisualize = (model) => {
    if (model) {
      setSelectedModel(model);
      setShowVisualization(true);
    }
  };

  const loadTargets = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/target");
      setTargetVariables(response.data);
      console.log();
    } catch (error) {
      console.error("Error loading target variables:", error);
    }
  };

  const loadFactors = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/factors");
      setAdminFactors(
        response.data.filter((factor) => factor.creator === "admin")
      );
      setUserFactors(
        response.data.filter((factor) => factor.creator !== "admin")
      );
    } catch (error) {
      console.error("Error loading factors:", error);
    }
  };

  const loadModels = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/models");
      if (response.data && typeof response.data === "object") {
        setModelLevels(
          Object.keys(response.data).map((levelKey) => ({
            level: parseInt(levelKey, 10),
            models: response.data[levelKey],
          }))
        );
      } else {
        console.error("Unexpected API response format:", response.data);
        setModelLevels([]);
      }
    } catch (error) {
      console.error("Error loading models:", error);
      setModelLevels([]);
    }
  };

  // const handleFactorClick = (factor) => {
  //   // Assuming factor.timeSeries contains the time series data for this factor
  //   setSelectedFactorData(factor);
  //   console.log(factor);
  //   console.log("Inside handleFactorClick");
  //   setIsChartVisible(true); // Show the chart
  // };

  const onSearchInput = () => {
    if (searchTerm.length > 0) {
      setFilteredFactors(
        [...adminFactors, ...userFactors].filter((factor) =>
          factor.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredFactors([]);
    }
  };

  const addFactorToDragArea = (factor) => {
    if (!selectedFactors.some((f) => f._id === factor._id)) {
      setSelectedFactors([...selectedFactors, { ...factor }]);
    }
    setSearchTerm("");
    setFilteredFactors([]);
    addRectangleToGraph(factor);
  };

  // const removeFactor = (factor) => {
  //   setSelectedFactors(selectedFactors.filter((f) => f._id !== factor._id));
  // };

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const retrainModel = async () => {
    const modelData = {
      name: modelName,
      factors: selectedFactors,
      target: selectedTarget,
    };
    try {
      const response = await axios.post(
        "http://localhost:5001/retrain",
        modelData
      );
      setModelQuality(response.data.quality);
    } catch (error) {
      console.error("Error retraining model:", error);
    }
  };

  const addRectangleToGraph = (factor) => {
    const portsOut = {
      position: {
        name: "right",
      },
      attrs: {
        label: { text: "out" },
        portBody: {
          magnet: true,
          r: 4,
          fill: "black",
          stroke: "white",
        },
      },
      markup: [
        {
          tagName: "circle",
          selector: "portBody",
        },
      ],
    };

    let rectColor = "#8e7fa2"; // Default purple color

    // Check if factorName is in targetVariables and change color accordingly
    if (targetVariables.includes(factor)) {
      rectColor = "#80396e"; // Change to a different color, e.g., tomato red (#ff6347)
    }

    if (graphRef.current && graphRef.current.graph) {
      const newX = lastRectPosition.x + 10;
      const newY = lastRectPosition.y + 10;
      const rect = new joint.shapes.standard.Rectangle({
        ports: {
          groups: {
            out: portsOut,
          },
        },
        factor: factor,
        markup: [
          { tagName: "rect", selector: "body" },
          { tagName: "text", selector: "label" },
        ],
      });
      rect.position(newX, newY); // Adjust position as needed
      rect.resize(120, 40);
      rect.attr({
        body: {
          fill: rectColor, // Purple color
          borderRadius: "3px",
          stroke: "#121212",
        },
        label: {
          text: factor.name,
          fill: "white",
          fontSize: 10, // Smaller font size
        },
      });

      rect.addPorts([
        {
          group: "out",
          // attrs: { label: { text: "out" } },
        },
      ]);
      console.log("Inside addRectangle");
      // rect.on("element:pointerclick", () => handleFactorClick(factor));
      console.log("Called handleFactorClick inside addRectangle");
      graphRef.current.graph.addCells(rect);
      console.log("Graph is: ", JSON.stringify(graphRef.current.graph));
      setLastRectPosition({ x: newX, y: newY });
    }
  };

  function showLinkTools(linkView) {
    var infoButton = new joint.linkTools.Button({
      markup: [
        {
          tagName: "circle", // Defines the button as a circle
          selector: "button", // Selector for styling and interaction
          attributes: {
            r: 7, // Radius of the circle
            fill: "#001DFF", // Blue fill color for the button
            cursor: "pointer", // Changes cursor to pointer on hover
          },
        },
        {
          tagName: "path", // Defines an icon inside the circle using SVG path
          selector: "icon", // Selector for icon styling
          attributes: {
            d: "M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4", // Path data for an "i" icon (information symbol)
            fill: "none", // No fill for the path
            stroke: "#FFFFFF", // White stroke color for the icon
            "stroke-width": 2, // Stroke width of the icon lines
            "pointer-events": "none", // Prevents pointer events on the icon itself
          },
        },
      ],
      distance: 60, // Distance from the link (adjust as needed)
      action: function (evt) {
        // Action to perform when the button is clicked
        linkModal.show(linkView.model, (updatedData) => {
          // Update the link model with new values from modal input
          linkView.model.set({
            weight: updatedData.weight,
            trainable: updatedData.trainable,
          });
          console.log("Updated link data:", updatedData);
        });
      },
    });

    //const infoButton = new joint.linkTools.InfoButton();

    // const removeButton = new joint.linkTools.Remove();
    //var sourceAnchorTool = new joint.linkTools.SourceAnchor();

    const tools = new joint.dia.ToolsView({
      tools: [infoButton],
    });

    linkView.addTools(tools);
  }

  const createLinkBetweenSelected = (weight) => {
    if (selectedElements.length === 2) {
      const link = new joint.shapes.standard.Link();
      link.source(selectedElements[0]);
      link.target(selectedElements[1]);
      link.attr({
        line: {
          stroke: "#000",
          strokeWidth: 2,
        },
        label: {
          position: 0.5,
          text: `Weight: ${weight}`, // You can customize the weight here
          fill: "#000",
        },
      });
      link.addTo(graphRef.current);

      // Clear selection after linking
      setSelectedElements([]);
      // Reset colors
      selectedElements.forEach((el) => el.attr("body/fill", "#8e7fa2"));
    } else {
      alert("Please select exactly two rectangles to create a link.");
    }
  };

  const convertGraphToSavableFormat = (graph) => {
    const allCells = graph.getCells();
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

    // Access the username from the retrieved object
    const userId = loggedUser ? loggedUser.id : null;

    const coreData = {
      name: modelName,
      description: "A brief description of the model",
      links: [],
      target_factor: selectedTarget,
      creator: userId,
      quality: 0.12,
      deleted: false,
      graphData: JSON.stringify(graph),
    };

    allCells.forEach((cell) => {
      if (cell.isLink()) {
        const linkData = {
          start_factor: cell.getSourceCell().attributes.attrs.label.text,
          end_factor: cell.getTargetCell().attributes.attrs.label.text,
          weight: cell.attributes.weight || 1,
        };
        coreData.links.push(linkData);
      }
    });

    // const graphData = graph.toJSON();
    return JSON.stringify(coreData);
  };

  const saveGraphToAPI = async (graph) => {
    const savableData = convertGraphToSavableFormat(graph);

    try {
      const response = await fetch("http://localhost:5001/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: savableData,
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Model saved successfully:", result);
        alert("Model saved successfully!");
      } else {
        console.error("Failed to save models:", result.message);
        alert(result.message || "Failed to save models.");
      }
    } catch (error) {
      console.error("Error saving models:", error);
      alert("An error occurred while saving models.");
    }
    console.log(graph);
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    const username = loggedUser ? loggedUser.username : null;

    console.log(username);
  };

  return (
    <Box sx={{ height: "100%", backgroundColor: "#121212" }}>
      <AppBar
        position="static"
        sx={{ height: "8vh", backgroundColor: "#734f7f" }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/aimm-logo.png`}
              alt="AIMM"
              style={{ height: "40px", marginRight: "10px" }}
            />
            AI Mental Modeler
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {" "}
          </Typography>
          <CustomButton color="inherit" onClick={handleLogout}>
            Logout
          </CustomButton>
        </Toolbar>
      </AppBar>
      <Grid container sx={{ display: "flex", maxHeight: "92vh" }}>
        <Grid
          item
          sx={{
            paddingTop: "12px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            maxWidth: "24vw",

            borderRadius: "3px",
            border: "solid black 0.5px",
            backgroundColor: "#1E201E", // Dark grey background
            boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
            overflowY: "auto",
          }}
          gap={2}
        >
          <Box
            sx={{
              margin: "3px",
              padding: "4px",
              borderRadius: "3px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              // backgroundColor: "#3f3f3f",
            }}
          >
            <SearchBar>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onInput={onSearchInput}
                placeholder="Search factors..."
              />
              <CustomButton onClick={onSearchInput}>Search</CustomButton>
            </SearchBar>
            {filteredFactors.length > 0 && (
              <div>
                {filteredFactors.map((factor) => (
                  <FactorItem
                    key={factor._id}
                    onClick={() => addFactorToDragArea(factor)}
                  >
                    {factor.name}
                  </FactorItem>
                ))}
              </div>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              marginX: "6px",
              margin: "3px",
              borderRadius: "10px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              padding: "12px",
              backgroundColor: "#3f3f3f",
              gap: "4px",
            }}
          >
            {targetVariables.map((variable) => (
              <CustomButton
                key={variable._id}
                onClick={() => {
                  setSelectedTarget(variable.name);
                  addRectangleToGraph(variable);
                }}
              >
                {variable.name}
              </CustomButton>
            ))}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              margin: "3px",
              borderRadius: "10px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              padding: "12px",
              backgroundColor: "#3f3f3f",
              gap: "4px",
            }}
          >
            <Typography
              sx={{ color: "white", textAlign: "center", width: "100%" }}
            >
              Admin Factors
            </Typography>
            <Box sx={{ display: "flex", flexGrow: "1", flexWrap: "wrap" }}>
              {adminFactors.map((factor) => (
                <Box
                  sx={{
                    fontSize: "small",
                    margin: "2px",
                    borderRadius: "10px",
                    color: "",
                    // backgroundColor: "#c2a8ff",
                    backgroundColor: "#866790",
                    padding: "4px",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                  }}
                  key={factor._id}
                  onClick={() => addRectangleToGraph(factor)}
                >
                  {factor.name}
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              margin: "3px",
              borderRadius: "10px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              padding: "12px",
              backgroundColor: "#3f3f3f",
              gap: "4px",
            }}
          >
            <Typography
              sx={{ color: "white", textAlign: "center", width: "100%" }}
            >
              User Factors
            </Typography>
            <Box sx={{ display: "flex", flexGrow: "1", flexWrap: "wrap" }}>
              {userFactors.map((factor) => (
                <Box
                  sx={{
                    fontSize: "small",
                    margin: "2px",
                    borderRadius: "10px",
                    color: "",
                    backgroundColor: "#866790",
                    padding: "4px",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                  }}
                  key={factor._id}
                  onClick={() => addRectangleToGraph(factor)}
                >
                  {factor.name}
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <CustomButton onClick={openAddFactorModal}>Add Factor</CustomButton>
            {showAddFactorModal && (
              <AddFactorModal
                onClose={closeAddFactorModal}
                onAddSuccess={handleAddSuccess}
              />
            )}
          </Box>
        </Grid>
        <Grid
          item
          md
          sx={{
            borderRadius: "3px",
            paddingTop: "12px",
            padding: "10px",

            display: "flex",
            flexDirection: "column",
            backgroundColor: "#1E201E", // Dark grey background
            color: "#ffffff", // White text for contrast
            height: "92vh",
            flexGrow: 1, // Ensures it fills the remaining space
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignContent: "center",
              margin: "3px",
              padding: "8px",
              borderRadius: "10px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              backgroundColor: "#3f3f3f",
              marginBottom: "10px",
            }}
          >
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder=" Enter Model Name..."
              style={{
                width: "300px",
                borderRadius: "3px",
              }}
            />

            <Box>
              <CustomButton
                onClick={() => {
                  saveGraphToAPI(graphRef.current.graph);
                }}
              >
                Save
              </CustomButton>
              <CustomButton>Duplicate</CustomButton>
              <CustomButton>Retrain</CustomButton>
            </Box>
          </Box>

          <Box
            ref={graphRef}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignContent: "center",
              margin: "3px",
              padding: "8px",
              borderRadius: "5px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              backgroundColor: "#3f3f3f",
              flexGrow: 1, // Makes this Box fill the remaining space
              height: "80%",
            }}
          >
            {/* Content of the second box goes here */}
            {openPopovers.map((popover) => (
              <PopoverChart
                key={popover.id}
                componentData={popover.componentData}
                onClose={() => handleClosePopover(popover.id)}
              />
            ))}

            {/* Render ChartComponent */}
            {selectedFactorData && <ChartComponent data={selectedFactorData} />}
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center", // Center content vertically
              margin: "3px",
              padding: "8px",
              borderRadius: "10px",
              boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
              paddingTop: "6px",
              backgroundColor: "#3f3f3f",
              flexGrow: 1, // Makes this Box fill the remaining space
            }}
          >
            <Typography>Training Quality:</Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center", // Center CustomButton vertically
              }}
            >
              <DeleteButton>Delete</DeleteButton>
            </Box>
          </Box>
        </Grid>

        {/* Third Box */}
        <Grid
          item
          md
          sx={{
            maxWidth: "20%",
            paddingTop: "12px",
            borderRadius: "3px",
            padding: "10px",
            maxHeight: "92vh",
            backgroundColor: "#1E201E", // Dark grey background
            color: "#ffffff", // White text for contrast
            height: "100vh",
            flexDirection: "column",
            flexGrow: 1, // Ensures it fills the remaining space
            overflowY: "auto",
          }}
        >
          <Typography variant="h5" sx={{ textAlign: "center" }}>
            Existing Models
          </Typography>

          {modelLevels.map((level) => (
            <Box
              sx={{
                margin: "3px",
                marginTop: "24px",
                marginBottom: "24px",
                padding: "4px",
                borderRadius: "10px",
                boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.2)", // Darker shadow
                paddingTop: "6px",
                backgroundColor: "#3f3f3f",
              }}
              key={level.level}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRadius: "12px",
                  padding: "8px",
                }}
              >
                <Typography sx={{ fontSize: "18px" }}>
                  User Level {level.level}
                </Typography>

                {level.models.map((model) => (
                  <Box
                    key={model.name}
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: "1E201E",
                      gap: 2,
                      // border: "solid  0.2px",
                      borderRadius: "5px",
                    }}
                  >
                    <Typography sx={{ fontSize: "14px" }}>
                      {model.name}
                    </Typography>
                    <Box
                      sx={{
                        width: "80%",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography sx={{ fontSize: "14px" }}>
                        Quality: {model.quality}
                      </Typography>
                      <CustomButton onClick={() => handleVisualize(model)}>
                        Visualize
                      </CustomButton>
                      <ModelVisualization
                        model={selectedModel}
                        open={showVisualization}
                        onClose={() => setShowVisualization(false)}
                      />
                    </Box>
                    {/* <Modal
                      open={showVisualization}
                      onClose={() => setShowVisualization(false)}
                      aria-labelledby="modal-modal-title"
                      aria-describedby="modal-modal-description"
                      BackdropProps={{
                        sx: {
                          backgroundColor: "rgba(0, 0, 0, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 400,
                          bgcolor: "white",
                          // border: "2px solid #000",
                          // boxShadow: 24,
                          p: 4,
                        }}
                      >
                        <Typography
                          id="modal-modal-title"
                          variant="h6"
                          component="h2"
                        >
                          Model x
                        </Typography>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                          Visualization of model
                        </Typography>
                      </Box>
                    </Modal> */}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
