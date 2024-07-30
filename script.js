var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var NEAR = 2;
var REAL_COLOR = false;
var time = Date.now();
var pauseIfTooLong = function (callback) { return __awaiter(_this, void 0, void 0, function () {
    var dt;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                dt = Date.now() - time;
                if (!(dt >= 1000 / 60)) return [3 /*break*/, 2];
                return [4 /*yield*/, new Promise(function (resolve) { return requestAnimationFrame(resolve); })];
            case 1:
                _a.sent();
                if (callback) {
                    callback();
                }
                time = Date.now();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
function getRandomItem(items) {
    var rand = Math.random() * items.reduce(function (total, item) { return total + item.count; }, 0);
    var add = 0;
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (rand <= add + item.count) {
            return item;
        }
        add += item.count;
    }
}
function getPixel(x, y, _a) {
    var width = _a.width, data = _a.data;
    var index = (x + y * width) * 4;
    if (REAL_COLOR) {
        // Full color
        return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
    }
    else {
        // Approximation color
        return ((((data[index] >> 4) & 0xf) << 20) |
            (((data[index + 1] >> 4) & 0xf) << 12) |
            (((data[index + 2] >> 4) & 0xf) << 4));
    }
}
function testPatternColors(patternColors, pattern, exact) {
    if (exact === void 0) { exact = false; }
    for (var i = 0; i < patternColors.length; i++) {
        if (exact && patternColors[i] !== pattern.colors[i]) {
            return false;
        }
        if (!exact &&
            patternColors[i] !== -1 &&
            pattern.colors[i] !== -1 &&
            patternColors[i] !== pattern.colors[i]) {
            return false;
        }
    }
    return true;
}
function addPattern(patternColors, patterns) {
    var near = patterns.find(function (pattern) {
        return testPatternColors(patternColors, pattern, true);
    });
    if (!near) {
        near = { count: 1, colors: patternColors };
        patterns.push(near);
    }
    else {
        near.count++;
    }
}
function sortColorCount(a, b) {
    return b.count - a.count;
}
function getPatternColors(x, y, imageData) {
    var patternColors = [];
    for (var nearX = -NEAR; nearX <= 0; nearX++) {
        for (var nearY = -NEAR; nearY <= 0; nearY++) {
            if (!(nearX === 0 && nearY === 0)) {
                var nearAbsX = x + nearX;
                var nearAbsY = y + nearY;
                if (nearAbsX >= 0 &&
                    nearAbsX < imageData.width &&
                    nearAbsY >= 0 &&
                    nearAbsY < imageData.height) {
                    patternColors.push(getPixel(nearAbsX, nearAbsY, imageData));
                }
                else {
                    patternColors.push(-2);
                }
            }
        }
    }
    return patternColors;
}
function extractColorList(input) {
    return __awaiter(this, void 0, void 0, function () {
        var canvas, ctx, imageData, colors, topLeftColor, x, _loop_1, y;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    canvas = document.createElement("canvas");
                    canvas.width = input.width;
                    canvas.height = input.height;
                    ctx = canvas.getContext("2d");
                    ctx.drawImage(input, 0, 0);
                    imageData = ctx.getImageData(0, 0, input.width, input.height);
                    colors = [];
                    x = 0;
                    _a.label = 1;
                case 1:
                    if (!(x < imageData.width)) return [3 /*break*/, 6];
                    _loop_1 = function (y) {
                        var color, colorData, patternColors;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, pauseIfTooLong()];
                                case 1:
                                    _b.sent();
                                    color = getPixel(x, y, imageData);
                                    colorData = colors.find(function (data) { return data.color === color; });
                                    if (!colorData) {
                                        colorData = {
                                            color: color,
                                            count: 1,
                                            patterns: []
                                        };
                                        colors.push(colorData);
                                    }
                                    else {
                                        colorData.count++;
                                    }
                                    if (!topLeftColor) {
                                        topLeftColor = colorData;
                                    }
                                    patternColors = getPatternColors(x, y, imageData);
                                    addPattern(patternColors, colorData.patterns);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    y = 0;
                    _a.label = 2;
                case 2:
                    if (!(y < imageData.height)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(y)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    y++;
                    return [3 /*break*/, 2];
                case 5:
                    x++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, { colors: colors, topLeftColor: topLeftColor }];
            }
        });
    });
}
function process(input, output) {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, _a, colors, topLeftColor, _i, colors_1, colorData, dataArray, fakeImageData, y, _loop_2, x;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    output.width = output.width || input.width;
                    output.height = output.height || input.height;
                    ctx = output.getContext("2d");
                    console.time("Extract image colors");
                    return [4 /*yield*/, extractColorList(input)];
                case 1:
                    _a = _b.sent(), colors = _a.colors, topLeftColor = _a.topLeftColor;
                    console.timeEnd("Extract image colors");
                    console.time("Sort image colors");
                    colors.sort(sortColorCount);
                    for (_i = 0, colors_1 = colors; _i < colors_1.length; _i++) {
                        colorData = colors_1[_i];
                        colorData.patterns.sort(sortColorCount);
                    }
                    console.timeEnd("Sort image colors");
                    console.time("Generate image colors");
                    dataArray = new Uint8ClampedArray(output.width * output.height * 4);
                    fakeImageData = {
                        width: output.width,
                        height: output.height,
                        data: dataArray
                    };
                    y = 0;
                    _b.label = 2;
                case 2:
                    if (!(y < output.height)) return [3 /*break*/, 7];
                    _loop_2 = function (x) {
                        var color, patternColors_1, filteredColors, index;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, pauseIfTooLong(function () {
                                        return ctx.putImageData(new ImageData(dataArray, output.width), 0, 0);
                                    })];
                                case 1:
                                    _c.sent();
                                    color = -1;
                                    if (x === 0 && y === 0) {
                                        color = topLeftColor.color;
                                    }
                                    else {
                                        patternColors_1 = getPatternColors(x, y, fakeImageData);
                                        filteredColors = colors.filter(function (color) {
                                            return color.patterns.find(function (pattern) {
                                                return testPatternColors(patternColors_1, pattern, false);
                                            });
                                        });
                                        while (filteredColors.length === 0) {
                                            patternColors_1[Math.floor(Math.random() * patternColors_1.length)] = -1;
                                            filteredColors = colors.filter(function (color) {
                                                return color.patterns.find(function (pattern) {
                                                    return testPatternColors(patternColors_1, pattern, false);
                                                });
                                            });
                                        }
                                        filteredColors.map(function (colorData) {
                                            var patterns = colorData.patterns.filter(function (pattern) {
                                                return testPatternColors(patternColors_1, pattern, false);
                                            });
                                            return {
                                                color: colorData.color,
                                                patterns: patterns,
                                                count: patterns.reduce(function (total, pattern) { return total + pattern.count; }, colorData.count)
                                            };
                                        });
                                        filteredColors.sort(sortColorCount);
                                        color = getRandomItem(filteredColors).color;
                                    }
                                    index = (x + y * output.width) * 4;
                                    dataArray[index] = (color >> 16) & 0xff;
                                    dataArray[index + 1] = (color >> 8) & 0xff;
                                    dataArray[index + 2] = color & 0xff;
                                    dataArray[index + 3] = 0xff;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    x = 0;
                    _b.label = 3;
                case 3:
                    if (!(x < output.width)) return [3 /*break*/, 6];
                    return [5 /*yield**/, _loop_2(x)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    x++;
                    return [3 /*break*/, 3];
                case 6:
                    y++;
                    return [3 /*break*/, 2];
                case 7:
                    console.timeEnd("Generate image colors");
                    ctx.putImageData(new ImageData(dataArray, output.width), 0, 0);
                    return [2 /*return*/];
            }
        });
    });
}
function start(src, _a) {
    var width = _a.width, height = _a.height;
    return __awaiter(this, void 0, void 0, function () {
        var img, canvas;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    img = document.createElement("img");
                    img.setAttribute("src", src);
                    document.body.appendChild(img);
                    canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    document.body.appendChild(canvas);
                    document.body.appendChild(document.createElement("br"));
                    return [4 /*yield*/, new Promise(function (resolve) {
                            img.onload = function () { return resolve(process(img, canvas)); };
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, start("assets/cave.png", { width: 128, height: 32 })];
            case 1:
                _a.sent();
                return [4 /*yield*/, start("assets/square-2.png", { width: 64, height: 64 })];
            case 2:
                _a.sent();
                return [4 /*yield*/, start("assets/square.png", { width: 32, height: 32 })];
            case 3:
                _a.sent();
                return [4 /*yield*/, start("assets/input-4.png", { width: 128, height: 128 })];
            case 4:
                _a.sent();
                return [4 /*yield*/, start("assets/input-5.png", { width: 128, height: 128 })];
            case 5:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
