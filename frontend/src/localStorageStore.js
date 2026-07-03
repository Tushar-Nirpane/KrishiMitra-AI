// LocalStorage utilities to simulate offline storage support for farmers

export const getOfflineFarmer = () => {
  const data = localStorage.getItem("krishimitra_farmer");
  return data ? JSON.parse(data) : null;
};

export const getOfflineFarm = () => {
  const data = localStorage.getItem("krishimitra_farm");
  return data ? JSON.parse(data) : null;
};

export const getOfflineRecommendations = () => {
  const data = localStorage.getItem("krishimitra_recs");
  return data ? JSON.parse(data) : null;
};

export const saveOfflineFarmer = (farmer) => {
  localStorage.setItem("krishimitra_farmer", JSON.stringify(farmer));
};

export const saveOfflineFarm = (farm) => {
  localStorage.setItem("krishimitra_farm", JSON.stringify(farm));
};

export const saveOfflineRecommendations = (recs) => {
  localStorage.setItem("krishimitra_recs", JSON.stringify(recs));
};

export const clearOfflineStore = () => {
  localStorage.removeItem("krishimitra_farmer");
  localStorage.removeItem("krishimitra_farm");
  localStorage.removeItem("krishimitra_recs");
  localStorage.removeItem("krishimitra_chat");
};

export const saveOfflineChatHistory = (chatLogs) => {
  localStorage.setItem("krishimitra_chat", JSON.stringify(chatLogs));
};

export const getOfflineChatHistory = () => {
  const data = localStorage.getItem("krishimitra_chat");
  return data ? JSON.parse(data) : [];
};

// Generates fallback recommendations entirely in Javascript if backend is offline or simulated offline
export const generateLocalOfflineRecommendations = (soilData) => {
  const { nitrogen, phosphorus, potassium, ph, organic_carbon } = soilData;
  let recommended_crop = "Maize";
  let confidence = 75.0;
  let yield_factor = "1.8 - 2.5 tons per acre";
  let why = "Based on local rules: ";

  if (nitrogen < 30) {
    recommended_crop = "Groundnut";
    confidence = 82.0;
    yield_factor = "1.2 - 1.6 tons per acre";
    why += "Nitrogen levels are low, Groundnut is a legume that fixes nitrogen. ";
  } else if (ph < 6.0) {
    recommended_crop = "Groundnut";
    confidence = 68.0;
    why += "Soil is slightly acidic which suits groundnut. ";
  } else if (nitrogen > 80 && ph > 6.5) {
    recommended_crop = "Rice";
    confidence = 88.0;
    yield_factor = "2.5 - 3.4 tons per acre";
    why += "High nitrogen levels and suitable pH makes the land optimal for water-intensive rice. ";
  } else {
    recommended_crop = "Wheat";
    confidence = 79.0;
    yield_factor = "1.6 - 2.2 tons per acre";
    why += "Balanced soil values fit cool-season cereal grain crops like Wheat. ";
  }

  return {
    recommended_crop,
    confidence,
    expected_yield: yield_factor,
    why: why + "Note: Using local offline rule engine fallback.",
    offline: true
  };
};
