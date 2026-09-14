/*
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 License: MIT License (see below)

 Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

// draw using this instead of a canvas and call toLaTeX() afterward
function ExportAsLaTeX(isObsidian) {
    this._points = [];
    this._texData = "";
    this._scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)

    this.toLaTeX = function () {
        if (isObsidian) {
            return (
                "\\usepackage{tikz}\n" +
                "\\begin{document}\n" +
                "\\begin{tikzpicture}[scale=0.2]\n" +
                "\\tikzstyle{every node}+=[inner sep=0pt]\n" +
                this._texData +
                "\\end{tikzpicture}\n" +
                "\\end{document}\n"
            );
        } else {
            return (
                "\\documentclass[12pt]{article}\n" +
                "\\usepackage{tikz}\n" +
                "\n" +
                "\\begin{document}\n" +
                "\n" +
                "\\begin{center}\n" +
                "\\begin{tikzpicture}[scale=0.2]\n" +
                "\\tikzstyle{every node}+=[inner sep=0pt]\n" +
                this._texData +
                "\\end{tikzpicture}\n" +
                "\\end{center}\n" +
                "\n" +
                "\\end{document}\n"
            );
        }
    };

    this.beginPath = function () {
        this._points = [];
    };
    this.arc = function (x, y, radius, startAngle, endAngle, isReversed) {
        x *= this._scale;
        y *= this._scale;
        radius *= this._scale;
        if (endAngle - startAngle == Math.PI * 2) {
            this._texData +=
                "\\draw [" +
                this.strokeStyle +
                "] (" +
                fixed(x, 3) +
                "," +
                fixed(-y, 3) +
                ") circle (" +
                fixed(radius, 3) +
                ");\n";
        } else {
            if (isReversed) {
                var temp = startAngle;
                startAngle = endAngle;
                endAngle = temp;
            }
            if (endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }
            // TikZ needs the angles to be in between -2pi and 2pi or it breaks
            if (Math.min(startAngle, endAngle) < -2 * Math.PI) {
                startAngle += 2 * Math.PI;
                endAngle += 2 * Math.PI;
            } else if (Math.max(startAngle, endAngle) > 2 * Math.PI) {
                startAngle -= 2 * Math.PI;
                endAngle -= 2 * Math.PI;
            }
            startAngle = -startAngle;
            endAngle = -endAngle;
            this._texData +=
                "\\draw [" +
                this.strokeStyle +
                "] (" +
                fixed(x + radius * Math.cos(startAngle), 3) +
                "," +
                fixed(-y + radius * Math.sin(startAngle), 3) +
                ") arc (" +
                fixed((startAngle * 180) / Math.PI, 5) +
                ":" +
                fixed((endAngle * 180) / Math.PI, 5) +
                ":" +
                fixed(radius, 3) +
                ");\n";
        }
    };
    this.moveTo = this.lineTo = function (x, y) {
        x *= this._scale;
        y *= this._scale;
        this._points.push({ x: x, y: y });
    };
    this.stroke = function () {
        if (this._points.length == 0) return;
        this._texData += "\\draw [" + this.strokeStyle + "]";
        for (var i = 0; i < this._points.length; i++) {
            var p = this._points[i];
            this._texData +=
                (i > 0 ? " --" : "") +
                " (" +
                fixed(p.x, 2) +
                "," +
                fixed(-p.y, 2) +
                ")";
        }
        this._texData += ";\n";
    };
    this.fill = function () {
        if (this._points.length == 0) return;
        this._texData += "\\fill [" + this.strokeStyle + "]";
        for (var i = 0; i < this._points.length; i++) {
            var p = this._points[i];
            this._texData +=
                (i > 0 ? " --" : "") +
                " (" +
                fixed(p.x, 2) +
                "," +
                fixed(-p.y, 2) +
                ")";
        }
        this._texData += ";\n";
    };
    this.measureText = function (text) {
        var c = canvas.getContext("2d");
        c.font = '20px "Times New Romain", serif';
        return c.measureText(text);
    };
    this.advancedFillText = function (text, originalText, x, y, angleOrNull) {
        if (text.replace(" ", "").length > 0) {
            var nodeParams = "";
            // x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
            if (angleOrNull != null) {
                var width = this.measureText(text).width;
                var dx = Math.cos(angleOrNull);
                var dy = Math.sin(angleOrNull);
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0) (nodeParams = "[right] "), (x -= width / 2);
                    else (nodeParams = "[left] "), (x += width / 2);
                } else {
                    if (dy > 0) (nodeParams = "[below] "), (y -= 10);
                    else (nodeParams = "[above] "), (y += 10);
                }
            }
            x *= this._scale;
            y *= this._scale;

            originalText = originalText.replace(/@e/g, "\\varepsilon ");
            originalText = originalText.replace(/\es/g, "\\emptyset ");
            originalText = originalText.replace(
                /_(\w+)/g,
                (_, letters) => `_{${letters}}`
            );
            originalText = originalText.replace(/cup/g, "\\cup ");
            originalText = originalText.replace(/\*/g, "^*");
            originalText = originalText.replace(/->/g, "\\rightarrow ");
            originalText = originalText.replace(/\|/g, "\\mid ");
            originalText = originalText.replace(/\$/g, "\\$ ");
            originalText = originalText.replace(/blk/g, "\\sqcup ");
            originalText = originalText.replace(/blank/g, "\\sqcup ");

            this._texData +=
                "\\draw (" +
                fixed(x, 2) +
                "," +
                fixed(-y, 2) +
                ") node " +
                nodeParams +
                "{$" +
                originalText +
                "$};\n";
        }
    };

    this.translate = this.save = this.restore = this.clearRect = function () {};
}

// draw using this instead of a canvas and call toSVG() afterward
function ExportAsSVG() {
    this.fillStyle = "black";
    this.strokeStyle = "black";
    this.lineWidth = 1;
    this.font = "12px Arial, sans-serif";
    this._points = [];
    this._svgData = "";
    this._transX = 0;
    this._transY = 0;

    this.toSVG = function () {
        return (
            '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
            this._svgData +
            "</svg>\n"
        );
    };

    this.beginPath = function () {
        this._points = [];
    };
    this.arc = function (x, y, radius, startAngle, endAngle, isReversed) {
        x += this._transX;
        y += this._transY;
        var style =
            'stroke="' +
            this.strokeStyle +
            '" stroke-width="' +
            this.lineWidth +
            '" fill="none"';

        if (endAngle - startAngle == Math.PI * 2) {
            this._svgData +=
                "\t<ellipse " +
                style +
                ' cx="' +
                fixed(x, 3) +
                '" cy="' +
                fixed(y, 3) +
                '" rx="' +
                fixed(radius, 3) +
                '" ry="' +
                fixed(radius, 3) +
                '"/>\n';
        } else {
            if (isReversed) {
                var temp = startAngle;
                startAngle = endAngle;
                endAngle = temp;
            }

            if (endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }

            var startX = x + radius * Math.cos(startAngle);
            var startY = y + radius * Math.sin(startAngle);
            var endX = x + radius * Math.cos(endAngle);
            var endY = y + radius * Math.sin(endAngle);
            var useGreaterThan180 = Math.abs(endAngle - startAngle) > Math.PI;
            var goInPositiveDirection = 1;

            this._svgData += "\t<path " + style + ' d="';
            this._svgData += "M " + fixed(startX, 3) + "," + fixed(startY, 3) + " "; // startPoint(startX, startY)
            this._svgData += "A " + fixed(radius, 3) + "," + fixed(radius, 3) + " "; // radii(radius, radius)
            this._svgData += "0 "; // value of 0 means perfect circle, others mean ellipse
            this._svgData += +useGreaterThan180 + " ";
            this._svgData += +goInPositiveDirection + " ";
            this._svgData += fixed(endX, 3) + "," + fixed(endY, 3); // endPoint(endX, endY)
            this._svgData += '"/>\n';
        }
    };
    this.moveTo = this.lineTo = function (x, y) {
        x += this._transX;
        y += this._transY;
        this._points.push({ x: x, y: y });
    };
    this.stroke = function () {
        if (this._points.length == 0) return;
        this._svgData +=
            '\t<polygon stroke="' +
            this.strokeStyle +
            '" stroke-width="' +
            this.lineWidth +
            '" points="';
        for (var i = 0; i < this._points.length; i++) {
            this._svgData +=
                (i > 0 ? " " : "") +
                fixed(this._points[i].x, 3) +
                "," +
                fixed(this._points[i].y, 3);
        }
        this._svgData += '"/>\n';
    };
    this.fill = function () {
        if (this._points.length == 0) return;
        this._svgData +=
            '\t<polygon fill="' +
            this.fillStyle +
            '" stroke-width="' +
            this.lineWidth +
            '" points="';
        for (var i = 0; i < this._points.length; i++) {
            this._svgData +=
                (i > 0 ? " " : "") +
                fixed(this._points[i].x, 3) +
                "," +
                fixed(this._points[i].y, 3);
        }
        this._svgData += '"/>\n';
    };
    this.measureText = function (text) {
        var c = canvas.getContext("2d");
        c.font = '20px "Times New Romain", serif';
        return c.measureText(text);
    };
    this.fillText = function (text, x, y) {
        x += this._transX;
        y += this._transY;
        if (text.replace(" ", "").length > 0) {
            this._svgData +=
                '\t<text x="' +
                fixed(x, 3) +
                '" y="' +
                fixed(y, 3) +
                '" font-family="Times New Roman" font-size="20">' +
                textToXML(text) +
                "</text>\n";
        }
    };
    this.translate = function (x, y) {
        this._transX = x;
        this._transY = y;
    };

    this.save = this.restore = this.clearRect = function () {};
}

function StartLink(node, start) {
    this.node = node;
    this.deltaX = 0;
    this.deltaY = 0;
    this.text = "";

    if (start) {
        this.setAnchorPoint(start.x, start.y);
    }
}

StartLink.prototype.setAnchorPoint = function (x, y) {
    this.deltaX = x - this.node.x;
    this.deltaY = y - this.node.y;

    if (Math.abs(this.deltaX) < snapToPadding) {
        this.deltaX = 0;
    }

    if (Math.abs(this.deltaY) < snapToPadding) {
        this.deltaY = 0;
    }
};

StartLink.prototype.getEndPoints = function () {
    var startX = this.node.x + this.deltaX;
    var startY = this.node.y + this.deltaY;
    var end = this.node.closestPointOnCircle(startX, startY);
    return {
        startX: startX,
        startY: startY,
        endX: end.x,
        endY: end.y,
    };
};

StartLink.prototype.draw = function (c) {
    var stuff = this.getEndPoints();

    // draw the line
    c.beginPath();
    c.moveTo(stuff.startX, stuff.startY);
    c.lineTo(stuff.endX, stuff.endY);
    c.stroke();

    // draw the text at the end without the arrow
    var textAngle = Math.atan2(
        stuff.startY - stuff.endY,
        stuff.startX - stuff.endX
    );
    drawText(
        c,
        this.text,
        stuff.startX,
        stuff.startY,
        textAngle,
        selectedObject == this
    );

    // draw the head of the arrow
    drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
};

StartLink.prototype.containsPoint = function (x, y) {
    var stuff = this.getEndPoints();
    var dx = stuff.endX - stuff.startX;
    var dy = stuff.endY - stuff.startY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var percent =
        (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
    var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
    return percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding;
};

function Link(a, b) {
    this.nodeA = a;
    this.nodeB = b;
    this.text = "";
    this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

    // make anchor point relative to the locations of nodeA and nodeB
    this.parallelPart = 0.5; // percentage from nodeA to nodeB
    this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
}

Link.prototype.getAnchorPoint = function () {
    var dx = this.nodeB.x - this.nodeA.x;
    var dy = this.nodeB.y - this.nodeA.y;
    var scale = Math.sqrt(dx * dx + dy * dy);
    return {
        x:
            this.nodeA.x +
            dx * this.parallelPart -
            (dy * this.perpendicularPart) / scale,
        y:
            this.nodeA.y +
            dy * this.parallelPart +
            (dx * this.perpendicularPart) / scale,
    };
};

Link.prototype.setAnchorPoint = function (x, y) {
    var dx = this.nodeB.x - this.nodeA.x;
    var dy = this.nodeB.y - this.nodeA.y;
    var scale = Math.sqrt(dx * dx + dy * dy);
    this.parallelPart =
        (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
    this.perpendicularPart =
        (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
    // snap to a straight line
    if (
        this.parallelPart > 0 &&
        this.parallelPart < 1 &&
        Math.abs(this.perpendicularPart) < snapToPadding
    ) {
        this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
        this.perpendicularPart = 0;
    }
};

Link.prototype.getEndPointsAndCircle = function () {
    if (this.perpendicularPart == 0) {
        var midX = (this.nodeA.x + this.nodeB.x) / 2;
        var midY = (this.nodeA.y + this.nodeB.y) / 2;
        var start = this.nodeA.closestPointOnCircle(midX, midY);
        var end = this.nodeB.closestPointOnCircle(midX, midY);
        return {
            hasCircle: false,
            startX: start.x,
            startY: start.y,
            endX: end.x,
            endY: end.y,
        };
    }
    var anchor = this.getAnchorPoint();
    var circle = circleFromThreePoints(
        this.nodeA.x,
        this.nodeA.y,
        this.nodeB.x,
        this.nodeB.y,
        anchor.x,
        anchor.y
    );
    var isReversed = this.perpendicularPart > 0;
    var reverseScale = isReversed ? 1 : -1;
    var startAngle =
        Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) -
        (reverseScale * nodeRadius) / circle.radius;
    var endAngle =
        Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) +
        (reverseScale * nodeRadius) / circle.radius;
    var startX = circle.x + circle.radius * Math.cos(startAngle);
    var startY = circle.y + circle.radius * Math.sin(startAngle);
    var endX = circle.x + circle.radius * Math.cos(endAngle);
    var endY = circle.y + circle.radius * Math.sin(endAngle);
    return {
        hasCircle: true,
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        startAngle: startAngle,
        endAngle: endAngle,
        circleX: circle.x,
        circleY: circle.y,
        circleRadius: circle.radius,
        reverseScale: reverseScale,
        isReversed: isReversed,
    };
};

Link.prototype.draw = function (c) {
    var stuff = this.getEndPointsAndCircle();
    // draw arc
    c.beginPath();
    if (stuff.hasCircle) {
        c.arc(
            stuff.circleX,
            stuff.circleY,
            stuff.circleRadius,
            stuff.startAngle,
            stuff.endAngle,
            stuff.isReversed
        );
    } else {
        c.moveTo(stuff.startX, stuff.startY);
        c.lineTo(stuff.endX, stuff.endY);
    }
    c.stroke();
    // draw the head of the arrow
    if (stuff.hasCircle) {
        drawArrow(
            c,
            stuff.endX,
            stuff.endY,
            stuff.endAngle - stuff.reverseScale * (Math.PI / 2)
        );
    } else {
        drawArrow(
            c,
            stuff.endX,
            stuff.endY,
            Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX)
        );
    }
    // draw the text
    if (stuff.hasCircle) {
        var startAngle = stuff.startAngle;
        var endAngle = stuff.endAngle;
        if (endAngle < startAngle) {
            endAngle += Math.PI * 2;
        }
        var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
        var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
        var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
        drawText(c, this.text, textX, textY, textAngle, selectedObject == this);
    } else {
        var textX = (stuff.startX + stuff.endX) / 2;
        var textY = (stuff.startY + stuff.endY) / 2;
        var textAngle = Math.atan2(
            stuff.endX - stuff.startX,
            stuff.startY - stuff.endY
        );
        drawText(
            c,
            this.text,
            textX,
            textY,
            textAngle + this.lineAngleAdjust,
            selectedObject == this
        );
    }
};

Link.prototype.containsPoint = function (x, y) {
    var stuff = this.getEndPointsAndCircle();
    if (stuff.hasCircle) {
        var dx = x - stuff.circleX;
        var dy = y - stuff.circleY;
        var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
        if (Math.abs(distance) < hitTargetPadding) {
            var angle = Math.atan2(dy, dx);
            var startAngle = stuff.startAngle;
            var endAngle = stuff.endAngle;
            if (stuff.isReversed) {
                var temp = startAngle;
                startAngle = endAngle;
                endAngle = temp;
            }
            if (endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }
            if (angle < startAngle) {
                angle += Math.PI * 2;
            } else if (angle > endAngle) {
                angle -= Math.PI * 2;
            }
            return angle > startAngle && angle < endAngle;
        }
    } else {
        var dx = stuff.endX - stuff.startX;
        var dy = stuff.endY - stuff.startY;
        var length = Math.sqrt(dx * dx + dy * dy);
        var percent =
            (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
        var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
        return percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding;
    }
    return false;
};

function Node(x, y) {
    this.x = x;
    this.y = y;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.isAcceptState = false;
    this.text = "";
}

Node.prototype.setMouseStart = function (x, y) {
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
};

Node.prototype.setAnchorPoint = function (x, y) {
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
};

Node.prototype.draw = function (c) {
    // draw the circle
    c.beginPath();
    c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
    c.stroke();

    // draw the text
    drawText(c, this.text, this.x, this.y, null, selectedObject == this);

    // draw a double circle for an accept state
    if (this.isAcceptState) {
        c.beginPath();
        c.arc(this.x, this.y, nodeRadius - 6, 0, 2 * Math.PI, false);
        c.stroke();
    }
};

Node.prototype.closestPointOnCircle = function (x, y) {
    var dx = x - this.x;
    var dy = y - this.y;
    var scale = Math.sqrt(dx * dx + dy * dy);
    return {
        x: this.x + (dx * nodeRadius) / scale,
        y: this.y + (dy * nodeRadius) / scale,
    };
};

Node.prototype.containsPoint = function (x, y) {
    return (
        (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <
        nodeRadius * nodeRadius
    );
};

function SelfLink(node, mouse) {
    this.node = node;
    this.anchorAngle = 0;
    this.mouseOffsetAngle = 0;
    this.text = "";

    if (mouse) {
        this.setAnchorPoint(mouse.x, mouse.y);
    }
}

SelfLink.prototype.setMouseStart = function (x, y) {
    this.mouseOffsetAngle =
        this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
};

SelfLink.prototype.setAnchorPoint = function (x, y) {
    this.anchorAngle =
        Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
    // snap to 90 degrees
    var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
    if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
    // keep in the range -pi to pi so our containsPoint() function always works
    if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
    if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
};

SelfLink.prototype.getEndPointsAndCircle = function () {
    var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
    var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
    var circleRadius = 0.75 * nodeRadius;
    var startAngle = this.anchorAngle - Math.PI * 0.8;
    var endAngle = this.anchorAngle + Math.PI * 0.8;
    var startX = circleX + circleRadius * Math.cos(startAngle);
    var startY = circleY + circleRadius * Math.sin(startAngle);
    var endX = circleX + circleRadius * Math.cos(endAngle);
    var endY = circleY + circleRadius * Math.sin(endAngle);
    return {
        hasCircle: true,
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        startAngle: startAngle,
        endAngle: endAngle,
        circleX: circleX,
        circleY: circleY,
        circleRadius: circleRadius,
    };
};

SelfLink.prototype.draw = function (c) {
    var stuff = this.getEndPointsAndCircle();
    // draw arc
    c.beginPath();
    c.arc(
        stuff.circleX,
        stuff.circleY,
        stuff.circleRadius,
        stuff.startAngle,
        stuff.endAngle,
        false
    );
    c.stroke();
    // draw the text on the loop farthest from the node
    var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
    var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
    drawText(
        c,
        this.text,
        textX,
        textY,
        this.anchorAngle,
        selectedObject == this
    );
    // draw the head of the arrow
    drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
};

SelfLink.prototype.containsPoint = function (x, y) {
    var stuff = this.getEndPointsAndCircle();
    var dx = x - stuff.circleX;
    var dy = y - stuff.circleY;
    var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
    return Math.abs(distance) < hitTargetPadding;
};

function TemporaryLink(from, to) {
    this.from = from;
    this.to = to;
}

TemporaryLink.prototype.draw = function (c) {
    // draw the line
    c.beginPath();
    c.moveTo(this.to.x, this.to.y);
    c.lineTo(this.from.x, this.from.y);
    c.stroke();

    // draw the head of the arrow
    drawArrow(
        c,
        this.to.x,
        this.to.y,
        Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x)
    );
};

function restoreBackup() {
    if (!localStorage || !JSON) {
        return;
    }

    try {
        var backup = JSON.parse(localStorage["fsm"]);

        if (backup.nodeRadius) {
            nodeRadius = backup.nodeRadius;
            var slider = document.getElementById("nodeRadiusSlider");
            if (slider) {
                slider.value = nodeRadius;
                document.getElementById("nodeRadiusValue").textContent = nodeRadius;
            }
        }
        for (var i = 0; i < backup.nodes.length; i++) {
            var backupNode = backup.nodes[i];
            var node = new Node(backupNode.x, backupNode.y);
            node.isAcceptState = backupNode.isAcceptState;
            node.text = backupNode.text;
            nodes.push(node);
        }
        for (var i = 0; i < backup.links.length; i++) {
            var backupLink = backup.links[i];
            var link = null;
            if (backupLink.type == "SelfLink") {
                link = new SelfLink(nodes[backupLink.node]);
                link.anchorAngle = backupLink.anchorAngle;
                link.text = backupLink.text;
            } else if (backupLink.type == "StartLink") {
                link = new StartLink(nodes[backupLink.node]);
                link.deltaX = backupLink.deltaX;
                link.deltaY = backupLink.deltaY;
                link.text = backupLink.text;
            } else if (backupLink.type == "Link") {
                link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
                link.parallelPart = backupLink.parallelPart;
                link.perpendicularPart = backupLink.perpendicularPart;
                link.text = backupLink.text;
                link.lineAngleAdjust = backupLink.lineAngleAdjust;
            }
            if (link != null) {
                links.push(link);
            }
        }
    } catch (e) {
        localStorage["fsm"] = "";
    }
}

function saveBackup() {
    if (!localStorage || !JSON) {
        return;
    }

    var backup = {
        nodeRadius: nodeRadius,
        nodes: [],
        links: [],
    };
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var backupNode = {
            x: node.x,
            y: node.y,
            text: node.text,
            isAcceptState: node.isAcceptState,
        };
        backup.nodes.push(backupNode);
    }
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var backupLink = null;
        if (link instanceof SelfLink) {
            backupLink = {
                type: "SelfLink",
                node: nodes.indexOf(link.node),
                text: link.text,
                anchorAngle: link.anchorAngle,
            };
        } else if (link instanceof StartLink) {
            backupLink = {
                type: "StartLink",
                node: nodes.indexOf(link.node),
                text: link.text,
                deltaX: link.deltaX,
                deltaY: link.deltaY,
            };
        } else if (link instanceof Link) {
            backupLink = {
                type: "Link",
                nodeA: nodes.indexOf(link.nodeA),
                nodeB: nodes.indexOf(link.nodeB),
                text: link.text,
                lineAngleAdjust: link.lineAngleAdjust,
                parallelPart: link.parallelPart,
                perpendicularPart: link.perpendicularPart,
            };
        }
        if (backupLink != null) {
            backup.links.push(backupLink);
        }
    }

    localStorage["fsm"] = JSON.stringify(backup);
}

function det(a, b, c, d, e, f, g, h, i) {
    return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
    var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
    var bx = -det(
        x1 * x1 + y1 * y1,
        y1,
        1,
        x2 * x2 + y2 * y2,
        y2,
        1,
        x3 * x3 + y3 * y3,
        y3,
        1
    );
    var by = det(
        x1 * x1 + y1 * y1,
        x1,
        1,
        x2 * x2 + y2 * y2,
        x2,
        1,
        x3 * x3 + y3 * y3,
        x3,
        1
    );
    var c = -det(
        x1 * x1 + y1 * y1,
        x1,
        y1,
        x2 * x2 + y2 * y2,
        x2,
        y2,
        x3 * x3 + y3 * y3,
        x3,
        y3
    );
    return {
        x: -bx / (2 * a),
        y: -by / (2 * a),
        radius: Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a)),
    };
}

function fixed(number, digits) {
    return number.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

var greekLetterNames = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",
];

function convertLatexShortcuts(text) {

    text = text.replace(/@s/g, '\\estack');
    text = text.replace(/@c/g, '\\ecell');
    text = text.replace(/@t/g, '\\dashv');

    text = text.replace(new RegExp('\\\\estack', 'g'), String.fromCharCode(10178));
    text = text.replace(new RegExp('\\\\ecell', 'g'), String.fromCharCode(8710));
    text = text.replace(new RegExp('\\\\dashv', 'g'), String.fromCharCode(8867));

    // html greek characters
    for (var i = 0; i < greekLetterNames.length; i++) {
        var name = greekLetterNames[i];
        text = text.replace(
            new RegExp("\\\\" + name, "g"),
            String.fromCharCode(913 + i + (i > 16))
        );
        text = text.replace(
            new RegExp("\\\\" + name.toLowerCase(), "g"),
            String.fromCharCode(945 + i + (i > 16))
        );
    }

    //easier epsilon
    text = text.replace(/@e/g, String.fromCharCode(949));

    //emptyset
    text = text.replace(/\es/g, String.fromCharCode(8709));

    // cup
    text = text.replace(/cup/g, "\u222A");

    // arrow
    text = text.replace(/->/g, "\u2192");

    // blank
    text = text.replace(/blk/g, "\u2294");
    text = text.replace(/blank/g, "\u2294");

    // subscripts
    text = text.replace(/_(\d+)/g, function (match, number) {
        var subscript = "";
        for (var i = 0; i < number.length; i++) {
            subscript += String.fromCharCode(8320 + parseInt(number[i]));
        }
        return subscript;
    });

    return text;
}

function textToXML(text) {
    text = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    var result = "";
    for (var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        if (c >= 0x20 && c <= 0x7e) {
            result += text[i];
        } else {
            result += "&#" + c + ";";
        }
    }
    return result;
}

function drawArrow(c, x, y, angle) {
    var dx = Math.cos(angle);
    var dy = Math.sin(angle);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
    c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
    c.fill();
}

function canvasHasFocus() {
    return (document.activeElement || document.body) == document.body;
}

function drawText(c, originalText, x, y, angleOrNull, isSelected) {
    const text = convertLatexShortcuts(originalText);
    c.font = '20px "Times New Roman", serif';

    var lines = text.split('\\n');
    var originalLines = originalText.split('\\n');

    if (angleOrNull != null && ((Math.abs(angleOrNull) < 2 * Math.PI && Math.abs(angleOrNull) > Math.PI) || (angleOrNull < 0 && angleOrNull > -Math.PI))) {
        lines = lines.reverse();
        originalLines = originalLines.reverse();
    }

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var width = c.measureText(line).width;

        var lineX = x - width / 2;

        if (angleOrNull != null) {
            var cos = Math.cos(angleOrNull);
            var sin = Math.sin(angleOrNull);
            var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
            var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
            var slide =
                sin * Math.pow(Math.abs(sin), 40) * cornerPointX -
                cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
            lineX += cornerPointX - sin * slide;
            y += cornerPointY + cos * slide;
        }

        if ("advancedFillText" in c) {
            c.advancedFillText(line, originalLines[i], lineX + width / 2, y, angleOrNull);
        } else {
            lineX = Math.round(lineX);
            y = Math.round(y);
            c.fillText(line, lineX, y + 6);
            if (isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
                lineX += width;
                c.beginPath();
                c.moveTo(lineX, y - 10);
                c.lineTo(lineX, y + 10);
                c.stroke();
            }
        }

        if (angleOrNull != null && ((Math.abs(angleOrNull) < 2 * Math.PI && Math.abs(angleOrNull) > Math.PI)) || (angleOrNull < 0 && angleOrNull > -Math.PI)) {
            y -= 20;
        } else {
            y += 20;
        }
    }
}

var caretTimer;
var caretVisible = true;

function resetCaret() {
    clearInterval(caretTimer);
    caretTimer = setInterval("caretVisible = !caretVisible; draw()", 500);
    caretVisible = true;
}

function tmClearInvalidLink(obj) {
    var idx = tmInvalidLinks.indexOf(obj);
    if (idx !== -1) tmInvalidLinks.splice(idx, 1);
}

var canvas;
var nodeRadius = 30;
var nodes = [];
var links = [];

var snapToPadding = 6; // pixels
var hitTargetPadding = 6; // pixels
var selectedObject = null; // either a Link or a Node
var currentLink = null; // a Link
var movingObject = false;
var originalClick;

var tmState = null;
var tmTape = [];
var tmHead = 0;
var tmTransitions = {};
var tmInitialState = null;
var tmAcceptStates = [];
var tmRunning = false;
var tmRunTimer = null;
var tmHalted = false;
var tmCurrentNode = null;
var tmCurrentLink = null;
var tmLinkTimer = null;
var tmStepCount = 0;
var tmInvalidLinks = [];
var tmHistory = [];
var tmInputMode = 'input';

function tmSetControlsEnabled(enabled) {
    ['tm-rewind-btn', 'tm-stepback-btn', 'tm-step-btn', 'tm-run-btn', 'tm-speed'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.disabled = !enabled;
    });
}

function dfaSetControlsEnabled(enabled) {
    ['dfa-rewind-btn', 'dfa-stepback-btn', 'dfa-step-btn', 'dfa-run-btn', 'dfa-speed'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.disabled = !enabled;
    });
}

function dpdaSetControlsEnabled(enabled) {
    ['dpda-rewind-btn', 'dpda-stepback-btn', 'dpda-step-btn', 'dpda-run-btn', 'dpda-speed'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.disabled = !enabled;
    });
}
var selectedNodes = [];
var lastDragMouse = null;
var selectionRect = null;

var simMode = 'tm';
var dfaInput = '';
var dfaPosition = 0;
var dfaState = null;
var dfaTransitions = {};
var dfaInitialState = null;
var dfaAcceptStates = [];
var dfaRunning = false;
var dfaRunTimer = null;
var dfaHalted = false;
var dfaAccepted = false;
var dfaStepCount = 0;
var dfaHistory = [];
var dfaBlinkCell = -1;
var dfaBlinkTimeout = null;

var dpdaInput = '';
var dpdaPosition = 0;
var dpdaState = null;
var dpdaTransitions = {};
var dpdaInitialState = null;
var dpdaAcceptStates = [];
var dpdaRunning = false;
var dpdaRunTimer = null;
var dpdaHalted = false;
var dpdaAccepted = false;
var dpdaStepCount = 0;
var dpdaHistory = [];
var dpdaStack = [];
var dpdaBlinkCell = -1;
var dpdaBlinkTimeout = null;

function drawUsing(c) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(0.5, 0.5);

    for (var i = 0; i < nodes.length; i++) {
        c.lineWidth = 1;
        if (nodes[i] == tmCurrentNode && nodes[i] != selectedObject) {
            c.beginPath();
            c.arc(nodes[i].x, nodes[i].y, nodeRadius, 0, 2 * Math.PI, false);
            c.fillStyle = '#1e90ff';
            c.fill();
            c.fillStyle = c.strokeStyle = 'black';
        } else if (nodes[i] == selectedObject || selectedNodes.indexOf(nodes[i]) !== -1) {
            c.fillStyle = c.strokeStyle = "blue";
        } else {
            c.fillStyle = c.strokeStyle = "black";
        }
        nodes[i].draw(c);
    }
    for (var i = 0; i < links.length; i++) {
        if (links[i] == tmCurrentLink) {
            c.lineWidth = 2;
            c.fillStyle = c.strokeStyle = '#1e90ff';
        } else if (links[i] == selectedObject) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = 'blue';
        } else if (tmInvalidLinks.indexOf(links[i]) !== -1) {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = '#c62828';
        } else {
            c.lineWidth = 1;
            c.fillStyle = c.strokeStyle = 'black';
        }
        links[i].draw(c);
    }
    if (currentLink != null) {
        c.lineWidth = 1;
        c.fillStyle = c.strokeStyle = "black";
        currentLink.draw(c);
    }

    if (selectionRect !== null) {
        var rx = Math.min(selectionRect.x1, selectionRect.x2);
        var ry = Math.min(selectionRect.y1, selectionRect.y2);
        var rw = Math.abs(selectionRect.x2 - selectionRect.x1);
        var rh = Math.abs(selectionRect.y2 - selectionRect.y1);
        c.save();
        c.setLineDash([4, 3]);
        c.lineWidth = 1;
        c.strokeStyle = '#1565c0';
        c.fillStyle = 'rgba(21, 101, 192, 0.08)';
        c.fillRect(rx, ry, rw, rh);
        c.strokeRect(rx, ry, rw, rh);
        c.restore();
    }

    c.restore();
}

function draw() {
    drawUsing(canvas.getContext("2d"));
    saveBackup();
}

function clearCanvas() {
    nodes = [];
    links = [];
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    saveBackup();
}

function renumberStates() {
    if (nodes.length === 0) return;

    var startNode = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i] instanceof StartLink) { startNode = links[i].node; break; }
    }

    var adj = [];
    for (var i = 0; i < nodes.length; i++) adj.push([]);
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link instanceof Link) {
            var fromIdx = nodes.indexOf(link.nodeA);
            var toIdx = nodes.indexOf(link.nodeB);
            if (fromIdx !== -1 && toIdx !== -1 && adj[fromIdx].indexOf(toIdx) === -1) {
                adj[fromIdx].push(toIdx);
            }
        }
    }

    var order = [];
    var inOrder = [];
    for (var i = 0; i < nodes.length; i++) inOrder.push(false);

    if (startNode) {
        var startIdx = nodes.indexOf(startNode);
        var queue = [startIdx];
        inOrder[startIdx] = true;
        while (queue.length > 0) {
            var cur = queue.shift();
            order.push(cur);
            var neighbors = adj[cur];
            for (var j = 0; j < neighbors.length; j++) {
                if (!inOrder[neighbors[j]]) {
                    inOrder[neighbors[j]] = true;
                    queue.push(neighbors[j]);
                }
            }
        }
    }

    for (var i = 0; i < nodes.length; i++) {
        if (!inOrder[i]) order.push(i);
    }

    var allPrefixed = nodes.every(function(n) { return /^q_\d+$/.test(n.text); });
    var allNumbered = nodes.every(function(n) { return /^\d+$/.test(n.text); });

    for (var i = 0; i < order.length; i++) {
        if (allPrefixed) {
            nodes[order[i]].text = String(i);
        } else if (allNumbered) {
            nodes[order[i]].text = '';
        } else {
            nodes[order[i]].text = 'q_' + i;
        }
    }

    draw();
}

function centerStates() {
    if (nodes.length === 0) return;

    var minX = nodes[0].x, maxX = nodes[0].x;
    var minY = nodes[0].y, maxY = nodes[0].y;
    for (var i = 1; i < nodes.length; i++) {
        if (nodes[i].x < minX) minX = nodes[i].x;
        if (nodes[i].x > maxX) maxX = nodes[i].x;
        if (nodes[i].y < minY) minY = nodes[i].y;
        if (nodes[i].y > maxY) maxY = nodes[i].y;
    }

    var groupCx = (minX + maxX) / 2;
    var groupCy = (minY + maxY) / 2;
    var canvasCx = canvas.width / 2;
    var canvasCy = canvas.height / 2;
    var dx = canvasCx - groupCx;
    var dy = canvasCy - groupCy;

    for (var i = 0; i < nodes.length; i++) {
        nodes[i].x += dx;
        nodes[i].y += dy;
    }

    draw();
}

// Adjust link.perpendicularPart so the arc clears any node that lies on its straight path.
// Uses the parabolic approximation: arc offset at t ≈ p × 4t(1-t).
function autoAdjustLinkCurve(link) {
    if (!(link instanceof Link)) return;
    var ax = link.nodeA.x, ay = link.nodeA.y;
    var bx = link.nodeB.x, by = link.nodeB.y;
    var dx = bx - ax, dy = by - ay;
    var scale = Math.sqrt(dx * dx + dy * dy);
    if (scale < 1) return;

    var clearance = nodeRadius + 10;
    var requiredP = 0;

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node === link.nodeA || node === link.nodeB) continue;

        var cx = node.x, cy = node.y;
        // How far along AB is this node (0 = at A, 1 = at B)?
        var t = (dx * (cx - ax) + dy * (cy - ay)) / (scale * scale);
        if (t <= 0 || t >= 1) continue;

        // Signed perpendicular distance from the line AB (positive = left of A→B)
        var d = (dx * (cy - ay) - dy * (cx - ax)) / scale;
        if (Math.abs(d) >= clearance) continue; // already clear

        // Parabolic factor: how much the arc deviates at this t
        var ft = 4 * t * (1 - t);
        if (ft < 0.1) continue; // too close to an endpoint to help

        // Minimum p to push the arc (nodeRadius + 10) past the blocking node
        var pNeeded = d >= 0
            ? (d - clearance) / ft   // node is left → curve right (p < 0)
            : (d + clearance) / ft;  // node is right → curve left (p > 0)

        // Keep the constraint that demands the largest arc deflection
        if (Math.abs(pNeeded) > Math.abs(requiredP)) {
            requiredP = pNeeded;
        }
    }

    if (requiredP !== 0) {
        link.perpendicularPart = requiredP;
    }
}

function selectObject(x, y) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].containsPoint(x, y)) {
            return nodes[i];
        }
    }
    for (var i = 0; i < links.length; i++) {
        if (links[i].containsPoint(x, y)) {
            return links[i];
        }
    }
    return null;
}

function snapNode(node) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] == node) continue;

        if (Math.abs(node.x - nodes[i].x) < snapToPadding) {
            node.x = nodes[i].x;
        }

        if (Math.abs(node.y - nodes[i].y) < snapToPadding) {
            node.y = nodes[i].y;
        }
    }
}

window.onload = function () {
    canvas = document.getElementById("canvas");
    restoreBackup();
    draw();

    var tabContainer = document.querySelector('.tab-container');
    if (tabContainer) tabContainer.style.minWidth = tabContainer.offsetWidth + 'px';

    canvas.onmousedown = function (e) {
        var mouse = crossBrowserRelativeMousePos(e);
        selectedObject = selectObject(mouse.x, mouse.y);
        movingObject = false;
        originalClick = mouse;

        if (selectedObject != null) {
            if (shift && selectedObject instanceof Node) {
                currentLink = new SelfLink(selectedObject, mouse);
            } else {
                if (selectedNodes.indexOf(selectedObject) === -1) {
                    selectedNodes = [];
                }
                movingObject = true;
                lastDragMouse = mouse;
                if (selectedObject.setMouseStart) {
                    selectedObject.setMouseStart(mouse.x, mouse.y);
                }
            }
            resetCaret();
        } else if (ctrl) {
            selectionRect = {x1: mouse.x, y1: mouse.y, x2: mouse.x, y2: mouse.y};
            selectedNodes = [];
        } else if (shift) {
            currentLink = new TemporaryLink(mouse, mouse);
        } else {
            selectedNodes = [];
        }

        draw();

        if (canvasHasFocus()) {
            // disable drag-and-drop only if the canvas is already focused
            return false;
        } else {
            // otherwise, let the browser switch the focus away from wherever it was
            resetCaret();
            return true;
        }
    };

    canvas.ondblclick = function (e) {
        var mouse = crossBrowserRelativeMousePos(e);
        selectedObject = selectObject(mouse.x, mouse.y);

        if (selectedObject == null) {
            selectedObject = new Node(mouse.x, mouse.y);
            var k = 0;
            var used = nodes.map(function(n) { return n.text; });
            while (used.indexOf('q_' + k) !== -1) k++;
            selectedObject.text = 'q_' + k;
            nodes.push(selectedObject);
            resetCaret();
            draw();
        } else if (selectedObject instanceof Node) {
            selectedObject.isAcceptState = !selectedObject.isAcceptState;
            draw();
        }
    };

    canvas.onmousemove = function (e) {
        var mouse = crossBrowserRelativeMousePos(e);

        if (selectionRect !== null) {
            selectionRect.x2 = mouse.x;
            selectionRect.y2 = mouse.y;
            draw();
            return;
        }

        if (currentLink != null) {
            var targetNode = selectObject(mouse.x, mouse.y);
            if (!(targetNode instanceof Node)) {
                targetNode = null;
            }

            if (selectedObject == null) {
                if (targetNode != null) {
                    currentLink = new StartLink(targetNode, originalClick);
                } else {
                    currentLink = new TemporaryLink(originalClick, mouse);
                }
            } else {
                if (targetNode == selectedObject) {
                    currentLink = new SelfLink(selectedObject, mouse);
                } else if (targetNode != null) {
                    currentLink = new Link(selectedObject, targetNode);
                } else {
                    currentLink = new TemporaryLink(
                        selectedObject.closestPointOnCircle(mouse.x, mouse.y),
                        mouse
                    );
                }
            }
            draw();
        }

        if (movingObject) {
            if (selectedObject instanceof Node && selectedNodes.length > 1 && selectedNodes.indexOf(selectedObject) !== -1) {
                var dx = mouse.x - lastDragMouse.x;
                var dy = mouse.y - lastDragMouse.y;
                for (var mi = 0; mi < selectedNodes.length; mi++) {
                    selectedNodes[mi].x += dx;
                    selectedNodes[mi].y += dy;
                }
            } else {
                selectedObject.setAnchorPoint(mouse.x, mouse.y);
                if (selectedObject instanceof Node) {
                    snapNode(selectedObject);
                }
            }
            lastDragMouse = mouse;
            draw();
        }
    };

    canvas.onmouseup = function (e) {
        var mouse = crossBrowserRelativeMousePos(e);
        movingObject = false;

        if (selectionRect !== null) {
            var minX = Math.min(selectionRect.x1, selectionRect.x2);
            var maxX = Math.max(selectionRect.x1, selectionRect.x2);
            var minY = Math.min(selectionRect.y1, selectionRect.y2);
            var maxY = Math.max(selectionRect.y1, selectionRect.y2);
            for (var si = 0; si < nodes.length; si++) {
                if (nodes[si].x >= minX && nodes[si].x <= maxX &&
                    nodes[si].y >= minY && nodes[si].y <= maxY) {
                    if (selectedNodes.indexOf(nodes[si]) === -1) {
                        selectedNodes.push(nodes[si]);
                    }
                }
            }
            selectionRect = null;
            draw();
            return;
        }

        if (currentLink != null) {
            if (!(currentLink instanceof TemporaryLink)) {
                autoAdjustLinkCurve(currentLink);
                selectedObject = currentLink;
                links.push(currentLink);
                resetCaret();
            }
            currentLink = null;
            draw();
        }
    };
};

var shift = false;
var ctrl = false;

document.onkeydown = function (e) {
    var key = crossBrowserKey(e);

    if (key == 17) {
        ctrl = true;
    } else if (key == 16) {
        shift = true;
    } else if (!canvasHasFocus()) {
        // don't read keystrokes when other things have focus
        return true;
    } else if (key == 46 || (shift && key == 8)) {
        // delete key
        if (selectedObject != null) {
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i] == selectedObject) {
                    nodes.splice(i--, 1);
                }
            }
            for (var i = 0; i < links.length; i++) {
                if (
                    links[i] == selectedObject ||
                    links[i].node == selectedObject ||
                    links[i].nodeA == selectedObject ||
                    links[i].nodeB == selectedObject
                ) {
                    links.splice(i--, 1);
                }
            }
            selectedObject = null;
            draw();
        }
    } else if (key == 8) {
        // backspace key
        if (selectedObject != null && "text" in selectedObject) {
            tmClearInvalidLink(selectedObject);
            selectedObject.text = selectedObject.text.substr(
                0,
                selectedObject.text.length - 1
            );
            resetCaret();
            draw();
        }

        // backspace is a shortcut for the back button, but do NOT want to change pages
        return false;
    } else if (key == 13) {
        // enter key
        if (selectedObject != null && "text" in selectedObject) {
            tmClearInvalidLink(selectedObject);
            selectedObject.text += "\\n";
            resetCaret();
            draw();
        }

        return false;
    } else if (key == 32) {
        // space
        if (selectedObject == null) {
            mehrKonfetti();
        } else if ("text" in selectedObject) {
            tmClearInvalidLink(selectedObject);
            selectedObject.text += " ";
            resetCaret();
            draw();
        }

        return false;
    }
};

document.onkeyup = function (e) {
    var key = crossBrowserKey(e);

    if (key == 16) {
        shift = false;
    } else if (key == 17) {
        ctrl = false;
        if (selectionRect !== null) { selectionRect = null; draw(); }
    }
};

document.onkeypress = function (e) {
    // don't read keystrokes when other things have focus
    var key = crossBrowserKey(e);
    if (!canvasHasFocus()) {
        // don't read keystrokes when other things have focus
        return true;
    } else if (
        key >= 0x20 &&
        key <= 0x7e &&
        !e.metaKey &&
        !e.ctrlKey &&
        selectedObject != null &&
        "text" in selectedObject
    ) {
        tmClearInvalidLink(selectedObject);
        selectedObject.text += String.fromCharCode(key);
        resetCaret();
        draw();

        // don't let keys do their actions (like space scrolls down the page)
        return false;
    } else if (key == 8) {
        // backspace is a shortcut for the back button, but do NOT want to change pages
        return false;
    }
};

function crossBrowserKey(e) {
    e = e || window.event;
    return e.which || e.keyCode;
}

function crossBrowserRelativeMousePos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
}

function output(text) {
    var element = document.getElementById("output");
    element.style.display = "block";
    element.value = text;
}

function saveAsPNG() {
    var oldSelectedObject = selectedObject;
    selectedObject = null;
    drawUsing(canvas.getContext("2d"));
    var pngData = canvas.toDataURL("image/png");
    // Erstellen Sie einen Link und klicken Sie darauf, um das Bild herunterzuladen
    var downloadLink = document.createElement("a");
    downloadLink.href = pngData;
    downloadLink.download = "canvas.png";
    selectedObject = oldSelectedObject;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function saveAsSVG() {
    var exporter = new ExportAsSVG();
    var oldSelectedObject = selectedObject;
    selectedObject = null;
    drawUsing(exporter);
    selectedObject = oldSelectedObject;
    var svgData = exporter.toSVG();
    output(svgData);
    // Chrome isn't ready for this yet, the 'Save As' menu item is disabled
    // document.location.href = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function saveAsLaTeX() {
    var exporter = new ExportAsLaTeX(false);
    var oldSelectedObject = selectedObject;
    selectedObject = null;
    drawUsing(exporter);
    selectedObject = oldSelectedObject;
    var texData = exporter.toLaTeX();
    output(texData);
}

function saveAsLaTeXForObsidian() {
    var exporter = new ExportAsLaTeX(true);
    var oldSelectedObject = selectedObject;
    selectedObject = null;
    drawUsing(exporter);
    selectedObject = oldSelectedObject;
    var texData = exporter.toLaTeX();
    output(texData);
}

function saveAsJson() {
    var data = {
        nodeRadius: nodeRadius,
        nodes: [],
        links: [],
    };
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        data.nodes.push({
            x: node.x,
            y: node.y,
            text: node.text,
            isAcceptState: node.isAcceptState,
        });
    }
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var linkData = null;
        if (link instanceof SelfLink) {
            linkData = {
                type: "SelfLink",
                node: nodes.indexOf(link.node),
                text: link.text,
                anchorAngle: link.anchorAngle,
            };
        } else if (link instanceof StartLink) {
            linkData = {
                type: "StartLink",
                node: nodes.indexOf(link.node),
                text: link.text,
                deltaX: link.deltaX,
                deltaY: link.deltaY,
            };
        } else if (link instanceof Link) {
            linkData = {
                type: "Link",
                nodeA: nodes.indexOf(link.nodeA),
                nodeB: nodes.indexOf(link.nodeB),
                text: link.text,
                lineAngleAdjust: link.lineAngleAdjust,
                parallelPart: link.parallelPart,
                perpendicularPart: link.perpendicularPart,
            };
        }
        if (linkData != null) {
            data.links.push(linkData);
        }
    }
    var json = JSON.stringify(data, null, 2);

    if (window.showSaveFilePicker) {
        window.showSaveFilePicker({
            suggestedName: "fsm.json",
            types: [{ description: "JSON file", accept: { "application/json": [".json"] } }],
        }).then(function (fileHandle) {
            return fileHandle.createWritable();
        }).then(function (writable) {
            writable.write(json);
            return writable.close();
        }).catch(function (err) {
            if (err.name !== "AbortError") {
                console.error(err);
            }
        });
    } else {
        var blob = new Blob([json], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = "fsm.json";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    }
}

function loadJsonData(data) {
    nodes = [];
    links = [];

    if (data.nodeRadius) {
        nodeRadius = data.nodeRadius;
        var slider = document.getElementById("nodeRadiusSlider");
        if (slider) {
            slider.value = nodeRadius;
            document.getElementById("nodeRadiusValue").textContent = nodeRadius;
        }
    }
    for (var i = 0; i < data.nodes.length; i++) {
        var backupNode = data.nodes[i];
        var node = new Node(backupNode.x, backupNode.y);
        node.isAcceptState = backupNode.isAcceptState;
        node.text = backupNode.text;
        nodes.push(node);
    }
    for (var i = 0; i < data.links.length; i++) {
        var backupLink = data.links[i];
        var link = null;
        if (backupLink.type === "SelfLink") {
            link = new SelfLink(nodes[backupLink.node]);
            link.anchorAngle = backupLink.anchorAngle;
            link.text = backupLink.text;
        } else if (backupLink.type === "StartLink") {
            link = new StartLink(nodes[backupLink.node]);
            link.deltaX = backupLink.deltaX;
            link.deltaY = backupLink.deltaY;
            link.text = backupLink.text;
        } else if (backupLink.type === "Link") {
            link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
            link.parallelPart = backupLink.parallelPart;
            link.perpendicularPart = backupLink.perpendicularPart;
            link.text = backupLink.text;
            link.lineAngleAdjust = backupLink.lineAngleAdjust;
        }
        if (link !== null) {
            links.push(link);
        }
    }
    saveBackup();
    draw();
}

function loadFromJson() {
    if (window.showOpenFilePicker) {
        window.showOpenFilePicker({
            types: [{ description: "JSON file", accept: { "application/json": [".json"] } }],
            multiple: false,
        }).then(function (handles) {
            return handles[0].getFile();
        }).then(function (file) {
            return file.text();
        }).then(function (text) {
            loadJsonData(JSON.parse(text));
        }).catch(function (err) {
            if (err.name !== "AbortError") {
                alert("Failed to load file: " + err.message);
            }
        });
    } else {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = function () {
            var file = input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    loadJsonData(JSON.parse(e.target.result));
                } catch (err) {
                    alert("Failed to load file: " + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

function toTuring() {
    var startLink = null;
    var acceptNode = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i] instanceof StartLink) {
            startLink = links[i];
            break;
        }
    }
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].isAcceptState) {
            acceptNode = nodes[i];
            break;
        }
    }

    var lines = [];
    lines.push("initial q" + (startLink ? startLink.node.text : ""));
    lines.push("accept q" + (acceptNode ? acceptNode.text : ""));
    lines.push("");

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var fromText, toText;
        if (link instanceof Link) {
            fromText = link.nodeA.text;
            toText = link.nodeB.text;
        } else if (link instanceof SelfLink) {
            fromText = link.node.text;
            toText = link.node.text;
        } else {
            continue;
        }

        var useComma = /[^\s\/],[LRlr](\s|$)/i.test(link.text);
        var segments = link.text.trim().split(useComma ? /\s+/ : /\s{2,}/);
        for (var j = 0; j < segments.length; j++) {
            var segment = segments[j].trim();
            if (!segment) {
                continue;
            }
            var match = segment.match(/^(.+)\/(.+?)(?:\s+|,)([LRlr])$/i);
            if (match) {
                var read = match[1].replace(/\\ecell|\\dashv|@c|@t/g, "_");
                var write = match[2].replace(/\\ecell|\\dashv|@c|@t/g, "_");
                var dir = match[3].toLowerCase();
                lines.push(tmStateName(fromText) + " " + read + " " + tmStateName(toText) + " " + write + " " + dir);
            }
        }
    }

    for (var k = 0; k < lines.length - 1; k++) {
        if (lines[k] !== "") {
            lines[k] += ",";
        }
    }

    var text = lines.join("\n");
    output(text);
    navigator.clipboard.writeText(text).then(function () {
        window.open("https://alistat.eu/online/turingmachinesimulator", "_blank");
    });
}

function parseTuringProgram() {
    var startLink = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i] instanceof StartLink) { startLink = links[i]; break; }
    }
    var transitions = {};
    var initialState = startLink ? tmStateName(startLink.node.text) : null;
    var acceptStates = nodes.filter(function(n) { return n.isAcceptState; }).map(function(n) { return tmStateName(n.text); });
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var fromText, toText;
        if (link instanceof Link) {
            fromText = link.nodeA.text;
            toText = link.nodeB.text;
        } else if (link instanceof SelfLink) {
            fromText = link.node.text;
            toText = link.node.text;
        } else {
            continue;
        }
        var useComma = /[^\s\/],[LRlr](\s|$)/i.test(link.text);
        var segments = link.text.trim().split(useComma ? /\s+/ : /\s{2,}/);
        for (var j = 0; j < segments.length; j++) {
            var segment = segments[j].trim();
            if (!segment) continue;
            var match = segment.match(/^(.+)\/(.+?)(?:\s+|,)([LRlr])$/i);
            if (match) {
                var DASHV = String.fromCharCode(8867);
                var read = match[1].trim().replace(/\\ecell|@c/g, '_').replace(/\\dashv|@t/g, DASHV);
                var write = match[2].trim().replace(/\\ecell|@c/g, '_').replace(/\\dashv|@t/g, DASHV);
                var dir = match[3].trim().toLowerCase();
                transitions[tmStateName(fromText) + '|' + read] = { to: tmStateName(toText), write: write, dir: dir };
            }
        }
    }
    return { initialState: initialState, acceptStates: acceptStates, transitions: transitions };
}

function tmSaveHistory() {
    tmHistory.push({
        tape: tmTape.slice(),
        head: tmHead,
        state: tmState,
        stepCount: tmStepCount,
        halted: tmHalted
    });
}

function tmStepBack() {
    if (tmHistory.length === 0) return;
    if (tmRunning) tmStopRun();
    var prev = tmHistory.pop();
    tmTape = prev.tape;
    tmHead = prev.head;
    tmState = prev.state;
    tmStepCount = prev.stepCount;
    tmHalted = prev.halted;
    tmCurrentNode = tmNodeForState(tmState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    document.getElementById('tm-step-counter').textContent = 'Steps: ' + tmStepCount;
    document.getElementById('tm-status').textContent = 'State: ' + tmState;
    tmRender();
    draw();
}

function tmRewind() {
    if (tmHistory.length === 0) return;
    if (tmRunning) tmStopRun();
    var first = tmHistory[0];
    tmTape = first.tape;
    tmHead = first.head;
    tmState = first.state;
    tmStepCount = first.stepCount;
    tmHalted = first.halted;
    tmHistory = [];
    tmCurrentNode = tmNodeForState(tmState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    document.getElementById('tm-step-counter').textContent = 'Steps: ' + tmStepCount;
    document.getElementById('tm-status').textContent = 'State: ' + tmState;
    tmRender();
    draw();
}

function tmShowSpeedTooltip(slider) {
    var tooltip = document.getElementById('tm-speed-tooltip');
    if (!tooltip) return;
    var pct = (slider.value - slider.min) / (slider.max - slider.min);
    var thumbOffset = pct * slider.offsetWidth;
    tooltip.style.left = thumbOffset + 'px';
    var hz = tmGetSpeedHz();
    tooltip.textContent = hz < 1 ? hz.toFixed(2) + ' Hz' : hz < 10 ? hz.toFixed(1) + ' Hz' : Math.round(hz) + ' Hz';
    tooltip.style.display = 'block';
}

function tmHideSpeedTooltip() {
    var tooltip = document.getElementById('tm-speed-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function tmConvertArgs(input) {
    return input.split(',').map(function(arg) {
        var n = parseInt(arg.trim(), 10);
        return isNaN(n) || n < 0 ? arg.trim() : '1'.repeat(n);
    }).join('#');
}

function tmSetInputMode(mode) {
    tmInputMode = mode;
    var inputBtn = document.getElementById('mode-tm-input-btn');
    var argsBtn = document.getElementById('mode-tm-args-btn');
    if (inputBtn) { inputBtn.style.background = mode === 'input' ? '#d0e4f7' : '#f0f0f0'; inputBtn.style.fontWeight = mode === 'input' ? 'bold' : 'normal'; }
    if (argsBtn) { argsBtn.style.background = mode === 'args' ? '#d0e4f7' : '#f0f0f0'; argsBtn.style.fontWeight = mode === 'args' ? 'bold' : 'normal'; }
    tmUpdateInputPlaceholder();
}

function tmUpdateInputPlaceholder() {
    var el = document.getElementById('tm-input');
    var resultLabel = document.getElementById('tm-result-label');
    var isArgs = tmInputMode === 'args';
    if (el) el.placeholder = isArgs ? 'e.g. 3,0,2' : 'ε';
    if (resultLabel) resultLabel.style.display = isArgs ? '' : 'none';
}

function tmDecodeResult() {
    var positions = [];
    for (var i = 0; i < tmTape.length; i++) {
        if (tmTape[i] === '$') positions.push(i);
    }
    if (positions.length !== 2) return 'Error';
    var between = tmTape.slice(positions[0] + 1, positions[1]).join('');
    var segments = between.split('#');
    var nums = [];
    for (var j = 0; j < segments.length; j++) {
        if (segments[j] !== '' && !/^1+$/.test(segments[j])) return 'Error';
        nums.push(segments[j].length);
    }
    return nums.join(',');
}

function tmUpdateResult() {
    if (tmInputMode !== 'args') return;
    var resultEl = document.getElementById('tm-result');
    if (resultEl) resultEl.value = tmDecodeResult();
}

function tmStateName(text) {
    return /^[a-zA-Z]/.test(text) ? text : 'q' + text;
}

function tmNodeForState(state) {
    for (var i = 0; i < nodes.length; i++) {
        if (tmStateName(nodes[i].text) === state) return nodes[i];
    }
    return null;
}

function tmCompile() {
    tmInvalidLinks = [];
    var errors = [];

    var startLinks = links.filter(function(l) { return l instanceof StartLink; });
    if (startLinks.length === 0) {
        errors.push('No initial state found — add a start arrow to the FSM.');
    } else if (startLinks.length > 1) {
        errors.push('More than one initial state found — only one start arrow is allowed.');
    }

    var sym = '(?:\\\\[a-zA-Z]+|@[cts]|[^\\s/])';
    var symNc = '(?:\\\\[a-zA-Z]+|@[cts]|[^\\s/,])';
    var segmentPatternSpace = new RegExp('^' + sym + '\\/' + sym + '\\s+[LRlr]$');
    var segmentPatternComma = new RegExp('^' + symNc + '\\/' + symNc + ',[LRlr]$');
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (!(link instanceof Link) && !(link instanceof SelfLink)) continue;
        if (!link.text || !link.text.trim()) continue;
        var useComma = /[^\s\/],[LRlr](\s|$)/i.test(link.text);
        var segments = link.text.trim().split(useComma ? /\s+/ : /\s{2,}/);
        var invalid = false;
        for (var j = 0; j < segments.length; j++) {
            var seg = segments[j].trim();
            if (!seg) continue;
            if (!segmentPatternSpace.test(seg) && !segmentPatternComma.test(seg)) { invalid = true; break; }
        }
        if (invalid) {
            tmInvalidLinks.push(link);
            if (link instanceof SelfLink) {
                errors.push('Transition from <b>' + link.node.text + '</b> to itself is invalid.');
            } else {
                errors.push('Transition between <b>' + link.nodeA.text + '</b> and <b>' + link.nodeB.text + '</b> is invalid.');
            }
        }
    }
    return errors;
}

function tmInit() {
    document.getElementById('sim-panel').style.display = '';
    var errors = tmCompile();
    draw();
    if (errors.length > 0) {
        document.getElementById('tm-status').innerHTML =
            '<span style="color:#c62828;">' + errors.join('<br>') + '</span>';
        tmTape = ['_'];
        tmHead = 0;
        tmRender();
        return;
    }
    var prog = parseTuringProgram();
    tmInitialState = prog.initialState;
    tmAcceptStates = prog.acceptStates;
    tmTransitions = prog.transitions;
    var writesDollar = Object.keys(tmTransitions).some(function(k) { return tmTransitions[k].write === '$'; });
    tmSetInputMode(writesDollar ? 'args' : 'input');
    tmHalted = false;
    tmHistory = [];
    tmStopRun();
    var rawInput = document.getElementById('tm-input').value;
    var input = (tmInputMode === 'args') ? tmConvertArgs(rawInput) : rawInput;
    var DASHV = String.fromCharCode(8867);
    tmTape = [DASHV].concat(input.length > 0 ? input.split('') : ['_']);
    tmHead = 1;
    tmState = tmInitialState;
    tmCurrentNode = tmNodeForState(tmState);
    tmStepCount = 0;
    document.getElementById('tm-step-counter').textContent = 'Steps: 0';
    document.getElementById('tm-status').textContent = 'State: ' + tmState;
    var resultEl = document.getElementById('tm-result');
    if (resultEl) resultEl.value = '';
    var tapeEl = document.getElementById('tm-tape');
    if (tapeEl) tapeEl.style.display = 'flex';
    var loadXBtn = document.getElementById('tm-load-x-btn');
    if (loadXBtn) loadXBtn.style.display = 'inline-flex';
    tmSetControlsEnabled(true);
    tmRender();
    draw();
}

function tmStep() {
    if (tmHalted || tmState === null) return;
    tmSaveHistory();
    var cell = (tmHead >= 0 && tmHead < tmTape.length) ? tmTape[tmHead] : '_';
    if (!cell) cell = '_';
    var key = tmState + '|' + cell;
    var trans = tmTransitions[key];

    if (!trans) {
        tmHalted = true;
        var accepted = (tmAcceptStates.indexOf(tmState) !== -1);
        document.getElementById('tm-status').innerHTML = accepted
            ? '<span style="color:#2e7d32;font-weight:bold;">&#10003; ACCEPTED</span>'
            : '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> &mdash; no transition for state <b>' + tmState + '</b>, read <b>' + (cell === '_' ? '&#8710;' : cell) + '</b>';
        tmStopRun();
        tmRender();
        tmUpdateResult();
        draw();
        return;
    }

    var firedLink = tmFindLink(tmState, trans.to);

    var DASHV = String.fromCharCode(8867);
    if (tmHead === 0 && trans.write !== DASHV) {
        tmHalted = true;
        document.getElementById('tm-status').innerHTML =
            '<span style="color:#c62828;font-weight:bold;">&#10007; ERROR</span> &mdash; cannot overwrite the leftmost cell';
        tmStopRun();
        tmRender();
        tmUpdateResult();
        draw();
        return;
    }
    if (trans.dir === 'l' && tmHead === 0) {
        tmHalted = true;
        document.getElementById('tm-status').innerHTML =
            '<span style="color:#c62828;font-weight:bold;">&#10007; ERROR</span> &mdash; cannot move left from leftmost cell';
        tmStopRun();
        tmRender();
        tmUpdateResult();
        draw();
        return;
    }

    tmTape[tmHead] = trans.write;
    if (trans.dir === 'r') {
        tmHead++;
        if (tmHead >= tmTape.length) tmTape.push('_');
    } else if (trans.dir === 'l') {
        tmHead--;
    }

    tmState = trans.to;
    tmCurrentNode = tmNodeForState(tmState);

    if (tmAcceptStates.length > 0 && tmAcceptStates.indexOf(tmState) !== -1) {
        tmHalted = true;
        document.getElementById('tm-status').innerHTML =
            '<span style="color:#2e7d32;font-weight:bold;">&#10003; ACCEPTED</span>';
        tmStopRun();
    } else {
        document.getElementById('tm-status').textContent = 'State: ' + tmState;
    }

    tmStepCount++;
    document.getElementById('tm-step-counter').textContent = 'Steps: ' + tmStepCount;

    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = firedLink;
    var speedVal = tmGetSpeedHz();
    var highlightMs = Math.round(700 / speedVal);
    tmLinkTimer = setTimeout(function() { tmCurrentLink = null; draw(); }, highlightMs);

    tmRender();
    if (tmHalted) tmUpdateResult();
    draw();
}

function tmFindLink(fromState, toState) {
    for (var i = 0; i < links.length; i++) {
        var lnk = links[i];
        if (lnk instanceof Link && tmStateName(lnk.nodeA.text) === fromState && tmStateName(lnk.nodeB.text) === toState) return lnk;
        if (lnk instanceof SelfLink && tmStateName(lnk.node.text) === fromState && fromState === toState) return lnk;
    }
    return null;
}

function tmRender() {
    var tapeEl = document.getElementById('tm-tape');
    if (!tapeEl) return;
    var container = tapeEl.parentElement;
    var cellsVisible = Math.floor(container.clientWidth / 41);
    var renderEnd = Math.max(tmTape.length - 1, tmHead + 5, cellsVisible);
    while (tmTape.length <= renderEnd) tmTape.push('_');

    var html = '';
    for (var i = 0; i <= renderEnd; i++) {
        var ch = tmTape[i] || '_';
        var isHead = (i === tmHead);
        var bg, fg, bord;
        if (isHead) {
            bg = tmHalted ? (tmAcceptStates.indexOf(tmState) !== -1 ? '#2e7d32' : '#c62828') : '#1565c0';
            fg = '#fff';
            bord = '2px solid #333';
        } else {
            bg = '#f5f5f5'; fg = '#000'; bord = '1px solid #bbb';
        }
        html += '<div style="min-width:38px;height:44px;display:flex;align-items:center;justify-content:center;' +
            'background:' + bg + ';color:' + fg + ';border:' + bord + ';border-radius:4px;' +
            'font-size:18px;font-family:monospace;font-weight:' + (isHead ? 'bold' : 'normal') + ';flex-shrink:0;">' +
            (ch === '_' ? '&#8710;' : ch) + '</div>';
    }
    tapeEl.innerHTML = html;

    container.scrollLeft = Math.max(0, tmHead * 41 - container.clientWidth / 2 + 19);
}

function tmToggleRun() {
    if (tmRunning) {
        tmStopRun();
    } else {
        if (tmHalted) return;
        tmRunning = true;
        document.getElementById('tm-run-btn').textContent = '⏸';
        tmRunLoop();
    }
}

function tmRunLoop() {
    if (!tmRunning || tmHalted) { tmStopRun(); return; }
    tmStep();
    if (!tmHalted) {
        var speedVal = tmGetSpeedHz();
        tmRunTimer = setTimeout(tmRunLoop, Math.round(1000 / speedVal));
    }
}

function tmStopRun() {
    tmRunning = false;
    var btn = document.getElementById('tm-run-btn');
    if (btn) btn.textContent = '▶';
    if (tmRunTimer) { clearTimeout(tmRunTimer); tmRunTimer = null; }
}

const colors = ["#0169a3", "#5db12e", "#e56122"];

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function generateRandomConfetti() {
    const defaultSettings = {
        ticks: 800,
        startVelocity: 100,
        spread: randomInRange(10, 30),
        particleCount: randomInRange(100, 200),
        scalar: 1.5,
        drift: randomInRange(-0.2, 0.2),
        colors: colors,
    };

    return [
        {
            angle: 30,
            origin: { x: -0.2, y: randomInRange(0.5, 0.9) },
            ...defaultSettings,
        },
        {
            angle: 150,
            origin: { x: 1.2, y: randomInRange(0.5, 0.9) },
            ...defaultSettings,
        },
        /*{
              angle: randomInRange(210, 330),
              origin: {x: randomInRange(0.1, 0.9), y: -0.2},
              ...defaultSettings
          },*/
        {
            angle: 90,
            origin: { x: randomInRange(0.1, 0.9), y: 1.2 },
            ...defaultSettings,
        },
    ][Math.floor(Math.random() * 3)];
}

function mehrKonfetti() {
    confetti(generateRandomConfetti());
}

// ─── DFA Simulator ───────────────────────────────────────────────────────────

function dfaGetSpeedHz() {
    var val = parseInt(document.getElementById('dfa-speed').value);
    return 0.25 * Math.pow(512, val / 100);
}

function dfaStateName(text) {
    return /^[a-zA-Z]/.test(text) ? text : 'q' + text;
}

function dfaNodeForState(state) {
    for (var i = 0; i < nodes.length; i++) {
        if (dfaStateName(nodes[i].text) === state) return nodes[i];
    }
    return null;
}

function dfaFindLink(fromState, toState) {
    for (var i = 0; i < links.length; i++) {
        var lnk = links[i];
        if (lnk instanceof Link && dfaStateName(lnk.nodeA.text) === fromState && dfaStateName(lnk.nodeB.text) === toState) return lnk;
        if (lnk instanceof SelfLink && dfaStateName(lnk.node.text) === fromState && fromState === toState) return lnk;
    }
    return null;
}

function dfaCompile() {
    tmInvalidLinks = [];
    var errors = [];
    var startLinks = links.filter(function(l) { return l instanceof StartLink; });
    if (startLinks.length === 0) {
        errors.push('No initial state found — add a start arrow to the FSM.');
    } else if (startLinks.length > 1) {
        errors.push('More than one initial state found — only one start arrow is allowed.');
    }
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (!(link instanceof Link) && !(link instanceof SelfLink)) continue;
        if (!link.text || !link.text.trim()) continue;
        var symbols = link.text.trim().split(',').map(function(s) { return s.trim(); });
        var invalid = symbols.some(function(s) { return s.length !== 1; });
        if (invalid) {
            tmInvalidLinks.push(link);
            if (link instanceof SelfLink) {
                errors.push('Transition from <b>' + link.node.text + '</b>: labels must be single characters separated by commas.');
            } else {
                errors.push('Transition <b>' + link.nodeA.text + '</b> → <b>' + link.nodeB.text + '</b>: labels must be single characters separated by commas.');
            }
        }
    }
    return errors;
}

function parseDfaProgram() {
    var startLink = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i] instanceof StartLink) { startLink = links[i]; break; }
    }
    var acceptNodes = nodes.filter(function(n) { return n.isAcceptState; });
    var initialState = startLink ? dfaStateName(startLink.node.text) : null;
    var acceptStates = acceptNodes.map(function(n) { return dfaStateName(n.text); });
    var transitions = {};
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var fromText, toText;
        if (link instanceof Link) { fromText = link.nodeA.text; toText = link.nodeB.text; }
        else if (link instanceof SelfLink) { fromText = link.node.text; toText = link.node.text; }
        else { continue; }
        var symbols = link.text.trim().split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        for (var j = 0; j < symbols.length; j++) {
            transitions[dfaStateName(fromText) + '|' + symbols[j]] = { to: dfaStateName(toText), link: link };
        }
    }
    return { initialState: initialState, acceptStates: acceptStates, transitions: transitions };
}

function dfaSaveHistory() {
    dfaHistory.push({ position: dfaPosition, state: dfaState, stepCount: dfaStepCount, halted: dfaHalted, accepted: dfaAccepted });
}

function dfaInit() {
    var errors = dfaCompile();
    draw();
    if (errors.length > 0) {
        document.getElementById('dfa-status').innerHTML = '<span style="color:#c62828;">' + errors.join('<br>') + '</span>';
        dfaRender();
        return;
    }
    var prog = parseDfaProgram();
    dfaInitialState = prog.initialState;
    dfaAcceptStates = prog.acceptStates;
    dfaTransitions = prog.transitions;
    dfaHalted = false;
    dfaAccepted = false;
    dfaHistory = [];
    dfaStopRun();
    dfaStopBlink();
    dfaInput = document.getElementById('dfa-tape-input').value;
    dfaPosition = 0;
    dfaState = dfaInitialState;
    tmCurrentNode = dfaNodeForState(dfaState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    dfaStepCount = 0;
    document.getElementById('dfa-step-counter').textContent = 'Steps: 0';
    document.getElementById('dfa-status').textContent = 'State: ' + dfaState;
    var tapeEl = document.getElementById('dfa-tape');
    if (tapeEl) tapeEl.style.display = 'flex';
    var loadXBtn = document.getElementById('dfa-load-x-btn');
    if (loadXBtn) loadXBtn.style.display = 'inline-flex';
    dfaSetControlsEnabled(true);
    dfaRender();
    draw();
}

function dfaStep() {
    if (dfaHalted || dfaState === null) return;
    dfaSaveHistory();

    if (dfaPosition >= dfaInput.length) {
        dfaHalted = true;
        dfaAccepted = dfaAcceptStates.indexOf(dfaState) !== -1;
        document.getElementById('dfa-status').innerHTML = dfaAccepted
            ? '<span style="color:#2e7d32;font-weight:bold;">&#10003; ACCEPTED</span>'
            : '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> — state <b>' + dfaState + '</b> is not an accept state';
        dfaStopRun();
        dfaRender();
        draw();
        return;
    }

    var ch = dfaInput[dfaPosition];
    var trans = dfaTransitions[dfaState + '|' + ch];
    if (!trans) {
        dfaHalted = true;
        dfaAccepted = false;
        document.getElementById('dfa-status').innerHTML =
            '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> — no transition from state <b>' + dfaState + '</b> on <b>' + ch + '</b>';
        dfaStopRun();
        dfaRender();
        draw();
        return;
    }

    var firedLink = dfaFindLink(dfaState, trans.to);
    dfaState = trans.to;
    dfaPosition++;
    dfaStepCount++;
    document.getElementById('dfa-step-counter').textContent = 'Steps: ' + dfaStepCount;

    tmCurrentNode = dfaNodeForState(dfaState);
    var highlightMs = Math.round(700 / dfaGetSpeedHz());
    dfaStartBlink(firedLink, dfaPosition - 1, highlightMs);

    if (dfaPosition >= dfaInput.length) {
        dfaHalted = true;
        dfaAccepted = dfaAcceptStates.indexOf(dfaState) !== -1;
        document.getElementById('dfa-status').innerHTML = dfaAccepted
            ? '<span style="color:#2e7d32;font-weight:bold;">&#10003; ACCEPTED</span>'
            : '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> — state <b>' + dfaState + '</b> is not an accept state';
        dfaStopRun();
    } else {
        document.getElementById('dfa-status').textContent = 'State: ' + dfaState;
    }

    dfaRender();
    draw();
}

function dfaStepBack() {
    if (dfaHistory.length === 0) return;
    if (dfaRunning) dfaStopRun();
    dfaStopBlink();
    var prev = dfaHistory.pop();
    dfaPosition = prev.position;
    dfaState = prev.state;
    dfaStepCount = prev.stepCount;
    dfaHalted = prev.halted;
    dfaAccepted = prev.accepted;
    tmCurrentNode = dfaNodeForState(dfaState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    document.getElementById('dfa-step-counter').textContent = 'Steps: ' + dfaStepCount;
    document.getElementById('dfa-status').textContent = 'State: ' + dfaState;
    dfaRender();
    draw();
}

function dfaRewind() {
    if (dfaHistory.length === 0) return;
    if (dfaRunning) dfaStopRun();
    dfaStopBlink();
    var first = dfaHistory[0];
    dfaPosition = first.position;
    dfaState = first.state;
    dfaStepCount = first.stepCount;
    dfaHalted = first.halted;
    dfaAccepted = first.accepted;
    dfaHistory = [];
    tmCurrentNode = dfaNodeForState(dfaState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    document.getElementById('dfa-step-counter').textContent = 'Steps: ' + dfaStepCount;
    document.getElementById('dfa-status').textContent = 'State: ' + dfaState;
    dfaRender();
    draw();
}

function dfaToggleRun() {
    if (dfaRunning) {
        dfaStopRun();
    } else {
        if (dfaHalted) return;
        dfaRunning = true;
        document.getElementById('dfa-run-btn').textContent = '⏸';
        dfaRunLoop();
    }
}

function dfaRunLoop() {
    if (!dfaRunning || dfaHalted) { dfaStopRun(); return; }
    dfaStep();
    if (!dfaHalted) {
        dfaRunTimer = setTimeout(dfaRunLoop, Math.round(1000 / dfaGetSpeedHz()));
    }
}

function dfaStopRun() {
    dfaRunning = false;
    var btn = document.getElementById('dfa-run-btn');
    if (btn) btn.textContent = '►';
    if (dfaRunTimer) { clearTimeout(dfaRunTimer); dfaRunTimer = null; }
}

function dfaStartBlink(link, cell, durationMs) {
    if (dfaBlinkTimeout) { clearTimeout(dfaBlinkTimeout); dfaBlinkTimeout = null; }
    dfaBlinkCell = cell;
    tmCurrentLink = link;
    draw();
    dfaRender();
    dfaBlinkTimeout = setTimeout(function() {
        dfaBlinkTimeout = null;
        dfaBlinkCell = -1;
        tmCurrentLink = null;
        draw();
        dfaRender();
    }, durationMs);
}

function dfaStopBlink() {
    if (dfaBlinkTimeout) { clearTimeout(dfaBlinkTimeout); dfaBlinkTimeout = null; }
    dfaBlinkCell = -1;
    tmCurrentLink = null;
}

function dfaRender() {
    var tapeEl = document.getElementById('dfa-tape');
    if (!tapeEl || tapeEl.style.display === 'none') return;
    var input = dfaInput || '';
    var len = input.length;
    var acc = dfaHalted && dfaAccepted;
    var html = '';

    for (var i = 0; i < len; i++) {
        var ch = input[i];
        var isBlinkCell = (dfaBlinkCell === i);
        var isHead = (i === dfaPosition) && dfaBlinkCell === -1;
        var bg, fg, bord, fw;
        if (isBlinkCell) {
            bg = '#ff8f00'; fg = '#fff'; bord = '2px solid #e65100'; fw = 'bold';
        } else if (isHead) {
            bg = dfaHalted ? (acc ? '#2e7d32' : '#c62828') : '#1565c0';
            fg = '#fff'; bord = '2px solid #333'; fw = 'bold';
        } else if (i < dfaPosition) {
            bg = dfaHalted ? (acc ? '#c8e6c9' : '#ffcdd2') : '#e8e8e8';
            fg = dfaHalted ? (acc ? '#1b5e20' : '#b71c1c') : '#888';
            bord = '1px solid ' + (dfaHalted ? (acc ? '#a5d6a7' : '#ef9a9a') : '#ccc');
            fw = 'normal';
        } else {
            bg = '#f5f5f5'; fg = '#000'; bord = '1px solid #bbb'; fw = 'normal';
        }
        html += '<div style="min-width:38px;height:44px;display:flex;align-items:center;justify-content:center;' +
            'background:' + bg + ';color:' + fg + ';border:' + bord + ';border-radius:4px;' +
            'font-size:18px;font-family:monospace;font-weight:' + fw + ';flex-shrink:0;">' +
            ch + '</div>';
    }

    tapeEl.innerHTML = html;
    var container = tapeEl.parentElement;
    if (container) container.scrollLeft = Math.max(0, dfaPosition * 41 - container.clientWidth / 2 + 19);
}

// ─── DPDA Simulator ──────────────────────────────────────────────────────────

function dpdaGetSpeedHz() {
    var val = parseInt(document.getElementById('dpda-speed').value);
    return 0.25 * Math.pow(512, val / 100);
}

function dpdaStateName(text) {
    return /^[a-zA-Z]/.test(text) ? text : 'q' + text;
}

function dpdaNodeForState(state) {
    for (var i = 0; i < nodes.length; i++) {
        if (dpdaStateName(nodes[i].text) === state) return nodes[i];
    }
    return null;
}

function dpdaGetStackTop() {
    return dpdaStack.length === 0 ? '\\estack' : dpdaStack[dpdaStack.length - 1];
}

function dpdaSplitRules(text) {
    return text.split(/\\n|  /).map(function(s) { return s.trim(); }).filter(Boolean);
}

// Parse one rule line: "a,X / push XY"  |  "a,X / pop"  |  "a,X / @e"
function dpdaParseRule(ruleText) {
    ruleText = ruleText.trim();
    var slashIdx = ruleText.indexOf('/');
    if (slashIdx === -1) return null;
    var left = ruleText.substring(0, slashIdx).trim();
    var opText = ruleText.substring(slashIdx + 1).trim();
    var commaIdx = left.indexOf(',');
    if (commaIdx === -1) return null;
    var inputSym = left.substring(0, commaIdx).trim();
    var stackSym = left.substring(commaIdx + 1).trim();
    if (stackSym === '@s') stackSym = '\\estack';
    var opLower = opText.toLowerCase();
    var op;
    if (opLower === 'pop') {
        op = { type: 'pop' };
    } else if (opLower === '@e' || opLower === '\\epsilon' || opLower === 'ε' || opLower === '') {
        op = { type: 'noop' };
    } else if (opLower.startsWith('push ') && opText.length > 5) {
        var pushChars = opText.substring(5).trim().split('').filter(function(c) { return c !== ' '; });
        if (!pushChars.length) return null;
        op = { type: 'push', symbols: pushChars };
    } else {
        return null;
    }
    return { inputSym: inputSym, stackSym: stackSym, op: op };
}

function dpdaApplyOp(op, matchedStackSym) {
    var newStack = dpdaStack.slice();
    if (op.type === 'noop') {
        return newStack;
    } else if (op.type === 'pop') {
        if (matchedStackSym !== '\\estack') newStack.pop();
        return newStack;
    } else if (op.type === 'push') {
        for (var i = 0; i < op.symbols.length; i++) newStack.push(op.symbols[i]);
        return newStack;
    }
    return newStack;
}

function dpdaCompile() {
    tmInvalidLinks = [];
    var errors = [];
    var startLinks = links.filter(function(l) { return l instanceof StartLink; });
    if (startLinks.length === 0) {
        errors.push('No initial state found — add a start arrow to the FSM.');
    } else if (startLinks.length > 1) {
        errors.push('More than one initial state found — only one start arrow is allowed.');
    }
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (!(link instanceof Link) && !(link instanceof SelfLink)) continue;
        if (!link.text || !link.text.trim()) continue;
        var lines = dpdaSplitRules(link.text);
        var hasError = false;
        for (var j = 0; j < lines.length; j++) {
            var line = lines[j];
            if (!line) continue;
            var rule = dpdaParseRule(line);
            if (!rule) { hasError = true; break; }
            if (rule.inputSym.length !== 1) { hasError = true; break; }
            if (rule.stackSym !== '\\estack' && rule.stackSym.length !== 1) { hasError = true; break; }
        }
        if (hasError) {
            tmInvalidLinks.push(link);
            var name = link instanceof SelfLink ? link.node.text : (link.nodeA.text + ' → ' + link.nodeB.text);
            errors.push('Transition <b>' + name + '</b>: use <code>a,X / push XY</code>, <code>a,X / pop</code>, or <code>a,X / @e</code>');
        }
    }
    return errors;
}

function parseDpdaProgram(errors) {
    var startLink = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i] instanceof StartLink) { startLink = links[i]; break; }
    }
    var initialState = startLink ? dpdaStateName(startLink.node.text) : null;
    var acceptStates = nodes.filter(function(n) { return n.isAcceptState; }).map(function(n) { return dpdaStateName(n.text); });
    var transitions = {};
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var fromText, toText;
        if (link instanceof Link) { fromText = link.nodeA.text; toText = link.nodeB.text; }
        else if (link instanceof SelfLink) { fromText = link.node.text; toText = link.node.text; }
        else continue;
        if (!link.text || !link.text.trim()) continue;
        var lines = dpdaSplitRules(link.text);
        for (var j = 0; j < lines.length; j++) {
            var line = lines[j];
            if (!line) continue;
            var rule = dpdaParseRule(line);
            if (!rule) continue;
            var key = dpdaStateName(fromText) + '|' + rule.inputSym + '|' + rule.stackSym;
            if (transitions[key] && errors) {
                var stackLabel = rule.stackSym === '\\estack' ? String.fromCharCode(10178) : rule.stackSym;
                errors.push('Duplicate transition in state <b>' + fromText + '</b> on input <b>' + rule.inputSym + '</b>, stack top <b>' + stackLabel + '</b>');
                tmInvalidLinks.push(link);
            }
            transitions[key] = { to: dpdaStateName(toText), op: rule.op, link: link };
        }
    }
    return { initialState: initialState, acceptStates: acceptStates, transitions: transitions };
}

function dpdaSaveHistory() {
    dpdaHistory.push({ position: dpdaPosition, state: dpdaState, stepCount: dpdaStepCount, halted: dpdaHalted, accepted: dpdaAccepted, stack: dpdaStack.slice() });
}

function dpdaInit() {
    var errors = dpdaCompile();
    dpdaStopBlink();
    draw();
    var statusEl = document.getElementById('dpda-status');
    if (errors.length > 0) {
        if (statusEl) statusEl.innerHTML = '<span style="color:#c62828;">' + errors.join('<br>') + '</span>';
        return;
    }
    var prog = parseDpdaProgram(errors);
    if (errors.length > 0) {
        draw();
        if (statusEl) statusEl.innerHTML = '<span style="color:#c62828;">' + errors.join('<br>') + '</span>';
        return;
    }
    dpdaInitialState = prog.initialState;
    dpdaAcceptStates = prog.acceptStates;
    dpdaTransitions = prog.transitions;
    dpdaHalted = false;
    dpdaAccepted = false;
    dpdaHistory = [];
    dpdaStopRun();
    dpdaStopBlink();
    dpdaInput = document.getElementById('dpda-tape-input').value;
    dpdaPosition = 0;
    dpdaState = dpdaInitialState;
    dpdaStack = [];
    tmCurrentNode = dpdaNodeForState(dpdaState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    dpdaStepCount = 0;
    document.getElementById('dpda-step-counter').textContent = 'Steps: 0';
    if (statusEl) statusEl.textContent = 'State: ' + dpdaState;
    document.getElementById('dpda-tape').style.display = 'flex';
    var dpdaLoadXBtn = document.getElementById('dpda-load-x-btn');
    if (dpdaLoadXBtn) dpdaLoadXBtn.style.display = 'inline-flex';
    dpdaSetControlsEnabled(true);
    var sc = document.getElementById('dpda-stack-float');
    if (sc) sc.style.display = 'block';
    dpdaPositionStackFloat();
    dpdaRender();
    draw();
}

function dpdaPositionStackFloat() {
    var sc = document.getElementById('dpda-stack-float');
    var canvas = document.getElementById('canvas');
    if (!sc || !canvas || sc.dataset.userPositioned === '1') return;
    var rect = canvas.getBoundingClientRect();
    var inset = 14;
    sc.style.right = 'auto';
    sc.style.top = 'auto';
    sc.style.left = (rect.left + inset) + 'px';
    sc.style.bottom = (window.innerHeight - rect.bottom + inset) + 'px';
}

function dpdaStep() {
    if (dpdaHalted || dpdaState === null) return;
    dpdaSaveHistory();
    var stackTop = dpdaGetStackTop();
    var statusEl = document.getElementById('dpda-status');

    if (dpdaPosition >= dpdaInput.length) {
        dpdaHalted = true;
        dpdaAccepted = dpdaAcceptStates.indexOf(dpdaState) !== -1;
        if (statusEl) statusEl.innerHTML = dpdaAccepted
            ? '<span style="color:#2e7d32;font-weight:bold;">&#10003; ACCEPTED</span>'
            : '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> — state <b>' + dpdaState + '</b> is not an accept state';
        dpdaStopRun();
        dpdaRender();
        draw();
        return;
    }

    var ch = dpdaInput[dpdaPosition];
    var trans = dpdaTransitions[dpdaState + '|' + ch + '|' + stackTop];
    if (!trans) {
        dpdaHalted = true;
        dpdaAccepted = false;
        var stackDisplay = stackTop === '\\estack' ? String.fromCharCode(10178) : stackTop;
        if (statusEl) statusEl.innerHTML =
            '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> — no transition from <b>' + dpdaState + '</b> on input <b>' + ch + '</b>, stack top <b>' + stackDisplay + '</b>';
        dpdaStopRun();
        dpdaRender();
        draw();
        return;
    }

    var firedLink = trans.link;
    dpdaStack = dpdaApplyOp(trans.op, stackTop);
    dpdaState = trans.to;
    dpdaPosition++;
    dpdaStepCount++;
    document.getElementById('dpda-step-counter').textContent = 'Steps: ' + dpdaStepCount;
    tmCurrentNode = dpdaNodeForState(dpdaState);
    var highlightMs = Math.round(700 / dpdaGetSpeedHz());
    dpdaStartBlink(firedLink, dpdaPosition - 1, highlightMs);

    if (dpdaPosition >= dpdaInput.length) {
        dpdaHalted = true;
        dpdaAccepted = dpdaAcceptStates.indexOf(dpdaState) !== -1;
        if (statusEl) statusEl.innerHTML = dpdaAccepted
            ? '<span style="color:#2e7d32;font-weight:bold;">&#10003; ACCEPTED</span>'
            : '<span style="color:#c62828;font-weight:bold;">&#10007; REJECTED</span> — state <b>' + dpdaState + '</b> is not an accept state';
        dpdaStopRun();
    } else {
        if (statusEl) statusEl.textContent = 'State: ' + dpdaState;
    }

    dpdaRender();
    draw();
}

function dpdaStepBack() {
    if (dpdaHistory.length === 0) return;
    if (dpdaRunning) dpdaStopRun();
    dpdaStopBlink();
    var prev = dpdaHistory.pop();
    dpdaPosition = prev.position;
    dpdaState = prev.state;
    dpdaStepCount = prev.stepCount;
    dpdaHalted = prev.halted;
    dpdaAccepted = prev.accepted;
    dpdaStack = prev.stack;
    tmCurrentNode = dpdaNodeForState(dpdaState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    document.getElementById('dpda-step-counter').textContent = 'Steps: ' + dpdaStepCount;
    document.getElementById('dpda-status').textContent = 'State: ' + dpdaState;
    dpdaRender();
    draw();
}

function dpdaRewind() {
    if (dpdaHistory.length === 0) return;
    if (dpdaRunning) dpdaStopRun();
    dpdaStopBlink();
    var first = dpdaHistory[0];
    dpdaPosition = first.position;
    dpdaState = first.state;
    dpdaStepCount = first.stepCount;
    dpdaHalted = first.halted;
    dpdaAccepted = first.accepted;
    dpdaStack = first.stack;
    dpdaHistory = [];
    tmCurrentNode = dpdaNodeForState(dpdaState);
    if (tmLinkTimer) { clearTimeout(tmLinkTimer); tmLinkTimer = null; }
    tmCurrentLink = null;
    document.getElementById('dpda-step-counter').textContent = 'Steps: ' + dpdaStepCount;
    document.getElementById('dpda-status').textContent = 'State: ' + dpdaState;
    dpdaRender();
    draw();
}

function dpdaToggleRun() {
    if (dpdaRunning) {
        dpdaStopRun();
    } else {
        if (dpdaHalted) return;
        dpdaRunning = true;
        document.getElementById('dpda-run-btn').textContent = '⏸';
        dpdaRunLoop();
    }
}

function dpdaRunLoop() {
    if (!dpdaRunning || dpdaHalted) { dpdaStopRun(); return; }
    dpdaStep();
    if (!dpdaHalted) dpdaRunTimer = setTimeout(dpdaRunLoop, Math.round(1000 / dpdaGetSpeedHz()));
}

function dpdaStopRun() {
    dpdaRunning = false;
    var btn = document.getElementById('dpda-run-btn');
    if (btn) btn.textContent = '►';
    if (dpdaRunTimer) { clearTimeout(dpdaRunTimer); dpdaRunTimer = null; }
}

function dpdaStartBlink(link, cell, durationMs) {
    if (dpdaBlinkTimeout) { clearTimeout(dpdaBlinkTimeout); dpdaBlinkTimeout = null; }
    dpdaBlinkCell = cell;
    tmCurrentLink = link;
    draw();
    dpdaRender();
    dpdaBlinkTimeout = setTimeout(function() {
        dpdaBlinkTimeout = null;
        dpdaBlinkCell = -1;
        tmCurrentLink = null;
        draw();
        dpdaRender();
    }, durationMs);
}

function dpdaStopBlink() {
    if (dpdaBlinkTimeout) { clearTimeout(dpdaBlinkTimeout); dpdaBlinkTimeout = null; }
    dpdaBlinkCell = -1;
    tmCurrentLink = null;
}

function dpdaRender() {
    var tapeEl = document.getElementById('dpda-tape');
    if (!tapeEl || tapeEl.style.display === 'none') return;
    var input = dpdaInput || '';
    var len = input.length;
    var acc = dpdaHalted && dpdaAccepted;
    var html = '';
    for (var i = 0; i < len; i++) {
        var ch = input[i];
        var isBlinkCell = (dpdaBlinkCell === i);
        var isHead = (i === dpdaPosition) && dpdaBlinkCell === -1;
        var bg, fg, bord, fw;
        if (isBlinkCell) {
            bg = '#ff8f00'; fg = '#fff'; bord = '2px solid #e65100'; fw = 'bold';
        } else if (isHead) {
            bg = dpdaHalted ? (acc ? '#2e7d32' : '#c62828') : '#1565c0';
            fg = '#fff'; bord = '2px solid #333'; fw = 'bold';
        } else if (i < dpdaPosition) {
            bg = dpdaHalted ? (acc ? '#c8e6c9' : '#ffcdd2') : '#e8e8e8';
            fg = dpdaHalted ? (acc ? '#1b5e20' : '#b71c1c') : '#888';
            bord = '1px solid ' + (dpdaHalted ? (acc ? '#a5d6a7' : '#ef9a9a') : '#ccc');
            fw = 'normal';
        } else {
            bg = '#f5f5f5'; fg = '#000'; bord = '1px solid #bbb'; fw = 'normal';
        }
        html += '<div style="min-width:38px;height:44px;display:flex;align-items:center;justify-content:center;' +
            'background:' + bg + ';color:' + fg + ';border:' + bord + ';border-radius:4px;' +
            'font-size:18px;font-family:monospace;font-weight:' + fw + ';flex-shrink:0;">' + ch + '</div>';
    }
    tapeEl.innerHTML = html;
    var container = tapeEl.parentElement;
    if (container) container.scrollLeft = Math.max(0, dpdaPosition * 41 - container.clientWidth / 2 + 19);
    dpdaRenderStack();
}

function dpdaRenderStack() {
    var stackEl = document.getElementById('dpda-stack');
    if (!stackEl) return;
    var emptyChar = String.fromCharCode(10178);
    var html = '';
    if (dpdaStack.length === 0) {
        html = '<div style="min-width:44px;height:40px;display:flex;align-items:center;justify-content:center;' +
            'background:#f0f0f0;color:#bbb;border:1px dashed #ccc;border-radius:4px;' +
            'font-size:18px;font-family:monospace;" title="empty stack">' + emptyChar + '</div>';
    } else {
        for (var i = dpdaStack.length - 1; i >= 0; i--) {
            var isTop = (i === dpdaStack.length - 1);
            html += '<div style="min-width:44px;height:40px;display:flex;align-items:center;justify-content:center;' +
                'background:' + (isTop ? '#1565c0' : '#f5f5f5') + ';' +
                'color:' + (isTop ? '#fff' : '#333') + ';' +
                'border:' + (isTop ? '2px solid #0d47a1' : '1px solid #bbb') + ';' +
                'border-radius:4px;font-size:18px;font-family:monospace;' +
                'font-weight:' + (isTop ? 'bold' : 'normal') + ';">' +
                dpdaStack[i] + '</div>';
        }
    }
    stackEl.innerHTML = html;
}