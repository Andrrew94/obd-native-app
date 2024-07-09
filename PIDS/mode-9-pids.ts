export const MODE_9_PIDS: any = {
    "00": {
      PID: "00",
      Description: "Supported PIDs [01 - 20]",
      DataType: "Bit Encoded",
      Unit: "",
      Formula: function () { return null; }
    },
    "02": {
      PID: "02",
      Description: "Vehicle Identification Number (VIN)",
      DataType: "String",
      Unit: "",
      Formula: function (...args: number[]) { return args.map(arg => String.fromCharCode(arg)).join(''); }
    },
    "04": {
      PID: "04",
      Description: "Calibration ID",
      DataType: "String",
      Unit: "",
      Formula: function (...args: number[]) { return args.map(arg => String.fromCharCode(arg)).join(''); }
    },
    "06": {
      PID: "06",
      Description: "Calibration Verification Numbers (CVN)",
      DataType: "String",
      Unit: "",
      Formula: function (...args: number[]) { return args.map(arg => String.fromCharCode(arg)).join(''); }
    }
  };