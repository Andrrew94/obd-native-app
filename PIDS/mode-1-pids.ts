export const MODE_1_PIDS: any = {
    "00": {
      PID: "00",
      Description: "PIDs supported [01 - 20]",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "01": {
      PID: "01",
      Description: "Monitor status since DTCs cleared",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "02": {
      PID: "02",
      Description: "Freeze DTC",
      DataType: "Diagnostic Trouble Code",
      Unit: "",
      Formula: function () { return null; }
    },
    "03": {
      PID: "03",
      Description: "Fuel system status",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "04": {
      PID: "04",
      Description: "Calculated engine load",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "05": {
      PID: "05",
      Description: "Engine coolant temperature",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number) { return A - 40; }
    },
    "06": {
      PID: "06",
      Description: "Short term fuel trim—Bank 1",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "07": {
      PID: "07",
      Description: "Long term fuel trim—Bank 1",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "08": {
      PID: "08",
      Description: "Short term fuel trim—Bank 2",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "09": {
      PID: "09",
      Description: "Long term fuel trim—Bank 2",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "0A": {
      PID: "0A",
      Description: "Fuel pressure",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: number) { return A * 3; }
    },
    "0B": {
      PID: "0B",
      Description: "Intake manifold absolute pressure",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: any) { return A; }
    },
    "0C": {
      PID: "0C",
      Description: "Engine RPM",
      DataType: "Revolutions",
      Unit: "rpm",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 4; }
    },
    "0D": {
      PID: "0D",
      Description: "Vehicle speed",
      DataType: "Speed",
      Unit: "km/h",
      Formula: function (A: any) { return A; }
    },
    "0E": {
      PID: "0E",
      Description: "Timing advance",
      DataType: "Timing",
      Unit: "°",
      Formula: function (A: number) { return A / 2 - 64; }
    },
    "0F": {
      PID: "0F",
      Description: "Intake air temperature",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number) { return A - 40; }
    },
    "10": {
      PID: "10",
      Description: "MAF air flow rate",
      DataType: "Mass Flow Rate",
      Unit: "g/s",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 100; }
    },
    "11": {
      PID: "11",
      Description: "Throttle position",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "12": {
      PID: "12",
      Description: "Commanded secondary air status",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "13": {
      PID: "13",
      Description: "Oxygen sensors present (2 banks)",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "14": {
      PID: "14",
      Description: "Oxygen Sensor 1 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "15": {
      PID: "15",
      Description: "Oxygen Sensor 2 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "16": {
      PID: "16",
      Description: "Oxygen Sensor 3 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "17": {
      PID: "17",
      Description: "Oxygen Sensor 4 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "18": {
      PID: "18",
      Description: "Oxygen Sensor 5 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "19": {
      PID: "19",
      Description: "Oxygen Sensor 6 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "1A": {
      PID: "1A",
      Description: "Oxygen Sensor 7 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "1B": {
      PID: "1B",
      Description: "Oxygen Sensor 8 A: Voltage B: Short term fuel trim",
      DataType: "Voltage/Percentage",
      Unit: "V/%",
      Formula: function (A: number, B: number) { return { voltage: A / 200, trim: (B * 100) / 128 - 100 }; }
    },
    "1C": {
      PID: "1C",
      Description: "OBD standards this vehicle conforms to",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "1D": {
      PID: "1D",
      Description: "Oxygen sensors present (4 banks)",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "1E": {
      PID: "1E",
      Description: "Auxiliary input status",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "1F": {
      PID: "1F",
      Description: "Run time since engine start",
      DataType: "Time",
      Unit: "seconds",
      Formula: function (A: number, B: number) { return A * 256 + B; }
    },
    "20": {
      PID: "20",
      Description: "PIDs supported [21 - 40]",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "21": {
      PID: "21",
      Description: "Distance traveled with MIL on",
      DataType: "Distance",
      Unit: "km",
      Formula: function (A: number, B: number) { return A * 256 + B; }
    },
    "22": {
      PID: "22",
      Description: "Fuel rail pressure (relative to manifold vacuum)",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: number, B: number) { return (A * 256 + B) * 0.079; }
    },
    "23": {
      PID: "23",
      Description: "Fuel rail pressure (diesel, or gasoline direct inject)",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: number, B: number) { return (A * 256 + B) * 10; }
    },
    "24": {
      PID: "24",
      Description: "Oxygen Sensor 1 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "25": {
      PID: "25",
      Description: "Oxygen Sensor 2 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "26": {
      PID: "26",
      Description: "Oxygen Sensor 3 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "27": {
      PID: "27",
      Description: "Oxygen Sensor 4 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "28": {
      PID: "28",
      Description: "Oxygen Sensor 5 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "29": {
      PID: "29",
      Description: "Oxygen Sensor 6 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "2A": {
      PID: "2A",
      Description: "Oxygen Sensor 7 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "2B": {
      PID: "2B",
      Description: "Oxygen Sensor 8 A: Fuel–Air Equivalence Ratio B: Voltage",
      DataType: "Ratio/Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return { ratio: (2 / 65536) * (A * 256 + B), voltage: B / 200 }; }
    },
    "2C": {
      PID: "2C",
      Description: "Commanded EGR",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "2D": {
      PID: "2D",
      Description: "EGR Error",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "2E": {
      PID: "2E",
      Description: "Commanded evaporative purge",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "2F": {
      PID: "2F",
      Description: "Fuel level input",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "30": {
      PID: "30",
      Description: "Number of warm-ups since codes cleared",
      DataType: "Count",
      Unit: "",
      Formula: function (A: any) { return A; }
    },
    "31": {
      PID: "31",
      Description: "Distance traveled since codes cleared",
      DataType: "Distance",
      Unit: "km",
      Formula: function (A: number, B: number) { return A * 256 + B; }
    },
    "32": {
      PID: "32",
      Description: "Evap system vapor pressure",
      DataType: "Pressure",
      Unit: "Pa",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 4; }
    },
    "33": {
      PID: "33",
      Description: "Absolute barometric pressure",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: any) { return A; }
    },
    "34": {
      PID: "34",
      Description: "Oxygen Sensor 1 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "35": {
      PID: "35",
      Description: "Oxygen Sensor 2 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "36": {
      PID: "36",
      Description: "Oxygen Sensor 3 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "37": {
      PID: "37",
      Description: "Oxygen Sensor 4 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "38": {
      PID: "38",
      Description: "Oxygen Sensor 5 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "39": {
      PID: "39",
      Description: "Oxygen Sensor 6 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "3A": {
      PID: "3A",
      Description: "Oxygen Sensor 7 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "3B": {
      PID: "3B",
      Description: "Oxygen Sensor 8 A: Voltage B: Fuel–Air Equivalence Ratio",
      DataType: "Voltage/Ratio",
      Unit: "V",
      Formula: function (A: number, B: number, C: number) { return { voltage: A / 200, ratio: (2 / 65536) * (B * 256 + C) }; }
    },
    "3C": {
      PID: "3C",
      Description: "Catalyst Temperature Bank 1, Sensor 1",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 10 - 40; }
    },
    "3D": {
      PID: "3D",
      Description: "Catalyst Temperature Bank 2, Sensor 1",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 10 - 40; }
    },
    "3E": {
      PID: "3E",
      Description: "Catalyst Temperature Bank 1, Sensor 2",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 10 - 40; }
    },
    "3F": {
      PID: "3F",
      Description: "Catalyst Temperature Bank 2, Sensor 2",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 10 - 40; }
    },
    "40": {
      PID: "40",
      Description: "PIDs supported [41 - 60]",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "41": {
      PID: "41",
      Description: "Monitor status this drive cycle",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "42": {
      PID: "42",
      Description: "Control module voltage",
      DataType: "Voltage",
      Unit: "V",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 1000; }
    },
    "43": {
      PID: "43",
      Description: "Absolute load value",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number, B: number) { return (A * 256 + B) * 100 / 255; }
    },
    "44": {
      PID: "44",
      Description: "Fuel–Air commanded equivalence ratio",
      DataType: "Ratio",
      Unit: "",
      Formula: function (A: number, B: number) { return (2 / 65536) * (A * 256 + B); }
    },
    "45": {
      PID: "45",
      Description: "Relative throttle position",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "46": {
      PID: "46",
      Description: "Ambient air temperature",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number) { return A - 40; }
    },
    "47": {
      PID: "47",
      Description: "Absolute throttle position B",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "48": {
      PID: "48",
      Description: "Absolute throttle position C",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "49": {
      PID: "49",
      Description: "Accelerator pedal position D",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "4A": {
      PID: "4A",
      Description: "Accelerator pedal position E",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "4B": {
      PID: "4B",
      Description: "Accelerator pedal position F",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "4C": {
      PID: "4C",
      Description: "Commanded throttle actuator",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "4D": {
      PID: "4D",
      Description: "Time run with MIL on",
      DataType: "Time",
      Unit: "minutes",
      Formula: function (A: number, B: number) { return A * 256 + B; }
    },
    "4E": {
      PID: "4E",
      Description: "Time since trouble codes cleared",
      DataType: "Time",
      Unit: "minutes",
      Formula: function (A: number, B: number) { return A * 256 + B; }
    },
    "4F": {
      PID: "4F",
      Description: "Maximum value for Fuel–Air equivalence ratio, oxygen sensor voltage, oxygen sensor current, and intake manifold absolute pressure",
      DataType: "Various",
      Unit: "",
      Formula: function () { return null; }
    },
    "50": {
      PID: "50",
      Description: "Maximum value for air flow rate from mass air flow sensor",
      DataType: "Mass Flow Rate",
      Unit: "g/s",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 100; }
    },
    "51": {
      PID: "51",
      Description: "Fuel Type",
      DataType: "Code",
      Unit: "",
      Formula: function () { return null; }
    },
    "52": {
      PID: "52",
      Description: "Ethanol fuel percentage",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: any) { return A; }
    },
    "53": {
      PID: "53",
      Description: "Absolute evaporative system vapor pressure",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: number) { return A * 3; }
    },
    "54": {
      PID: "54",
      Description: "Evaporative system vapor pressure",
      DataType: "Pressure",
      Unit: "Pa",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 4; }
    },
    "55": {
      PID: "55",
      Description: "Short term secondary oxygen sensor trim—Bank 1 and Bank 3",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "56": {
      PID: "56",
      Description: "Long term secondary oxygen sensor trim—Bank 1 and Bank 3",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "57": {
      PID: "57",
      Description: "Short term secondary oxygen sensor trim—Bank 2 and Bank 4",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "58": {
      PID: "58",
      Description: "Long term secondary oxygen sensor trim—Bank 2 and Bank 4",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 128 - 100; }
    },
    "59": {
      PID: "59",
      Description: "Fuel rail absolute pressure",
      DataType: "Pressure",
      Unit: "kPa",
      Formula: function (A: number, B: number) { return (A * 256 + B) * 10; }
    },
    "5A": {
      PID: "5A",
      Description: "Relative accelerator pedal position",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: number) { return (A * 100) / 255; }
    },
    "5B": {
      PID: "5B",
      Description: "Hybrid battery pack remaining life",
      DataType: "Percentage",
      Unit: "%",
      Formula: function (A: any) { return A; }
    },
    "5C": {
      PID: "5C",
      Description: "Engine oil temperature",
      DataType: "Temperature",
      Unit: "°C",
      Formula: function (A: number) { return A - 40; }
    },
    "5D": {
      PID: "5D",
      Description: "Fuel injection timing",
      DataType: "Timing",
      Unit: "°",
      Formula: function (A: number, B: number) { return ((A * 256 + B) / 128) - 210; }
    },
    "5E": {
      PID: "5E",
      Description: "Engine fuel rate",
      DataType: "Rate",
      Unit: "L/h",
      Formula: function (A: number, B: number) { return (A * 256 + B) / 20; }
    },
    "5F": {
      PID: "5F",
      Description: "Emission requirements to which vehicle is designed",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "60": {
      PID: "60",
      Description: "PIDs supported [61 - 80]",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    }
};
