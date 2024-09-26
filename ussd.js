const express = require("express");
const router = express.Router();
const wasteData = require('./wasteData');

const sessionState = {};
const leaderboard = []; // Track users based on collected waste

router.post("/", (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  console.log('USSD Request:', req.body);

  // Initialize session state if not present
  if (!sessionState[sessionId]) {
    sessionState[sessionId] = { step: 0, subStep: 0, data: {} };
  }

  const userState = sessionState[sessionId];
  let response = "";

  // Waste registration options
  if (userState.step === 0) {
    response = "CON 🌍 Welcome to TakaConnect Waste Registration Service!\n";
    response += "1. 🗑️ Register waste\n";
    response += "2. 📦 Check waste supply status\n";
    response += "3. 📈 View real-time waste prices\n";
    response += "4. 🌱 Eco-friendly tips\n";
    response += "5. 🎁 View Incentives & Rewards\n";
    response += "6. 🏆 Check Leaderboard\n";
    userState.step = 1;
  } else if (userState.step === 1) {
    switch (text) {
      case "1":
        response = "CON 🗑️ Enter your location (e.g., Kisumu, Nairobi):\n";
        userState.step = 2;
        userState.subStep = 1;
        break;
      case "2":
        response = "CON 📦 Enter your waste ID to check status:\n";
        userState.step = 3;
        break;
      case "3":
        const prices = wasteData.prices.map(
          (price, index) => `${index + 1}. ${price.type}: KES ${price.pricePerKg}/kg`
        ).join("\n");
        response = `END 📈 Real-time Waste Prices:\n${prices}`;
        userState.step = 0;
        break;
      case "4":
        response = `END 🌱 Eco-friendly Tip: Reduce single-use plastics by carrying reusable shopping bags. Every small action counts!`;
        userState.step = 0;
        break;
      case "5":
        response = "CON 🎁 Incentives & Rewards:\n";
        response += "1. 💰 Check your earned incentives\n";
        response += "2. 📈 See how to earn more\n";
        userState.step = 4;
        break;
      case "6":
        response = "CON 🏆 Leaderboard:\n";
        const sortedLeaderboard = leaderboard.sort((a, b) => b.totalWaste - a.totalWaste);
        const topUsers = sortedLeaderboard.slice(0, 5).map((user, index) => `${index + 1}. ${user.phoneNumber}: ${user.totalWaste} kg`).join("\n");
        response += `${topUsers}\n\nEnter your Waste ID to see your position:\n`;
        userState.step = 5;
        break;
      default:
        response = "END ❌ Invalid option. Please try again.";
        userState.step = 0;
        break;
    }
  } 
  // Registering waste steps
  else if (userState.step === 2 && userState.subStep === 1) {
    userState.data.location = text;
    response = "CON 🗑️ Enter type of waste (e.g., Plastic, Organic):\n";
    userState.subStep = 2;
  } else if (userState.step === 2 && userState.subStep === 2) {
    userState.data.wasteType = text;
    response = "CON 🗑️ Enter quantity of waste (in kilograms):\n";
    userState.subStep = 3;
  } else if (userState.step === 2 && userState.subStep === 3) {
    userState.data.quantity = parseFloat(text);
    const wasteId = `W${Math.floor(Math.random() * 10000)}`;
    
    wasteData.wasteSupplies[wasteId] = {
      location: userState.data.location,
      type: userState.data.wasteType,
      quantity: userState.data.quantity,
      status: "Pending",
      phoneNumber: phoneNumber
    };

    // Add or update leaderboard
    const userIndex = leaderboard.findIndex(user => user.phoneNumber === phoneNumber);
    if (userIndex >= 0) {
      leaderboard[userIndex].totalWaste += userState.data.quantity;
    } else {
      leaderboard.push({ phoneNumber: phoneNumber, totalWaste: userState.data.quantity });
    }

    response = `END ✅ Waste registered successfully!\nWaste ID: ${wasteId}\nYou'll be contacted soon for pickup.\nYou have earned KES ${userState.data.quantity * 2} as an incentive! 🎉`;
    userState.step = 0;
    userState.subStep = 0;
  } 
  // Check waste supply status
  else if (userState.step === 3) {
    const wasteId = text;
    const wasteSupply = wasteData.wasteSupplies[wasteId];

    if (wasteSupply) {
      response = `END 📦 Waste Supply Status:\nLocation: ${wasteSupply.location}\nType: ${wasteSupply.type}\nQuantity: ${wasteSupply.quantity} kg\nStatus: ${wasteSupply.status}`;
    } else {
      response = "END ❌ No records found for this Waste ID. Please check and try again.";
    }
    userState.step = 0;
  } 
  // Incentives section
  else if (userState.step === 4) {
    switch (text) {
      case "1":
        const userLeaderboard = leaderboard.find(user => user.phoneNumber === phoneNumber);
        if (userLeaderboard) {
          response = `END 🎉 You have collected ${userLeaderboard.totalWaste} kg of waste and earned KES ${userLeaderboard.totalWaste * 2}. Keep it up! 🌟`;
        } else {
          response = "END ❌ You have not registered any waste yet. Start collecting to earn incentives!";
        }
        userState.step = 0;
        break;
      case "2":
        response = `END 📈 To earn more incentives:\n- Collect more recyclable materials.\n- Participate in community clean-up drives.\n- Refer others to TakaConnect.`;
        userState.step = 0;
        break;
      default:
        response = "END ❌ Invalid option. Please try again.";
        userState.step = 0;
        break;
    }
  } 
  // Leaderboard check
  else if (userState.step === 5) {
    const wasteId = text;
    const wasteSupply = wasteData.wasteSupplies[wasteId];

    if (wasteSupply) {
      const userPosition = leaderboard.findIndex(user => user.phoneNumber === wasteSupply.phoneNumber) + 1;
      response = `END 🏆 Your current leaderboard position is: ${userPosition}.\nKeep collecting waste to climb higher! 🚀`;
    } else {
      response = "END ❌ No records found for this Waste ID.";
    }
    userState.step = 0;
  }

  res.set("Content-Type: text/plain");
  res.send(response);
});

module.exports = router;
