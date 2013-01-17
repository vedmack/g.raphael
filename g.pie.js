/*
 * g.Raphael 0.5 - Charting library, based on Raphaël
 *
 * Copyright (c) 2009 Dmitry Baranovskiy (http://g.raphaeljs.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
(function () {

    function Piechart(paper, cx, cy, r, values, opts) {
        opts = opts || {};

        var chartinst = this,
            sectors = [],
            covers = paper.set(),
            chart = paper.set(),
            series = paper.set(),
            order = [],
            len = values.length,
            //taken from https://github.com/cederlof/g.raphael/commit/f532cd5d4233f8a4c02d07adcd39da1e5de81198
            angle = opts.startFromFixedAngle || 0,
            total = 0,
            others = 0,
            cut = 9,
            defcut = true;

        //taken from https://github.com/gorillatron/g.raphael/commit/9627e1ff8bb3f9ebfa14efe70ddc0d3d481d9285
        if(typeof opts.defcut != 'undefined') defcut = opts.defcut;

        function sector(cx, cy, r, startAngle, endAngle, fill) {
            var rad = Math.PI / 180,
                x1 = cx + r * Math.cos(-startAngle * rad),
                x2 = cx + r * Math.cos(-endAngle * rad),
                xm = cx + r / 2 * Math.cos(-(startAngle + (endAngle - startAngle) / 2) * rad),
                y1 = cy + r * Math.sin(-startAngle * rad),
                y2 = cy + r * Math.sin(-endAngle * rad),
                ym = cy + r / 2 * Math.sin(-(startAngle + (endAngle - startAngle) / 2) * rad),
                res = [
                    "M", cx, cy,
                    "L", x1, y1,
                    "A", r, r, 0, +(Math.abs(endAngle - startAngle) > 180), 1, x2, y2,
                    "z"
                ];

            res.middle = { x: xm, y: ym };
            return res;
        }

        chart.covers = covers;

        if (len == 1) {
            //use color from options if available
            series.push(paper.circle(cx, cy, r).attr({ fill: opts.colors && opts.colors[0] || chartinst.colors[0], stroke: opts.stroke || "#fff", "stroke-width": opts.strokewidth == null ? 1 : opts.strokewidth }));
            covers.push(paper.circle(cx, cy, r).attr(chartinst.shim));
            total = values[0];
            values[0] = { value: values[0], order: 0, valueOf: function () { return this.value; } };
            series[0].middle = {x: cx, y: cy};
            series[0].mangle = 180;
        } else {
            for (var i = 0; i < len; i++) {
                total += values[i];
                values[i] = { value: values[i], order: i, valueOf: function () { return this.value; } };
            }

            values.sort(function (a, b) {
                return b.value - a.value;
            });

            for (i = 0; i < len; i++) {
                if (defcut && values[i] * 360 / total <= 1.5) {
                    cut = i;
                    defcut = false;
                }

                if (i > cut) {
                    defcut = false;
                    values[cut].value += values[i];
                    values[cut].others = true;
                    others = values[cut].value;
                }
            }

            len = Math.min(cut + 1, values.length);
            others && values.splice(len) && (values[cut].others = true);

            for (i = 0; i < len; i++) {
              	var mangle;
            	if (opts.startFromFixedAngle)
	        	mangle = angle + 360 * values[i] / total / 2;
            	else {
                	mangle = angle - 360 * values[i] / total / 2;
                	if (!i) {
                   		angle = 90 - mangle;
                    		mangle = angle - 360 * values[i] / total / 2;
                	}
                }

                if (opts.init) {
                    var ipath = sector(cx, cy, 1, angle, angle - 360 * values[i] / total).join(",");
                }

                var p, path = sector(cx, cy, r, angle, angle -= 360 * values[i] / total);
                
                //edits below taken from https://github.com/blackwatertepes/g.raphael/commit/93d9728732dfd417e609809b8df67f8e2645bc93
                //and from https://github.com/gorillatron/g.raphael/commit/9627e1ff8bb3f9ebfa14efe70ddc0d3d481d9285
                if (values[i].value < total) {
                    var strokewidth = 0;
                    //If sector value < 0, remove stroke to hide sector
                    if (values[i].value > 0) {
                        strokewidth = (opts.strokewidth == null ? 1 : opts.strokewidth);
                    }
                    p = paper.path(opts.init ? ipath : path).attr({ fill: opts.colors && opts.colors[values[i].order] || chartinst.colors[i] || "#666", stroke: opts.stroke || "#fff", "stroke-width": strokewidth, "stroke-linejoin": "round" });
                   
                    p.value = values[i];
                    p.middle = path.middle;
                    p.mangle = mangle;
                    sectors.push(p);
                    series.push(p);
                    opts.init && p.animate({ path: path.join(",") }, (+opts.init - 1) || 1000, ">");
                    
                } else {
                    //If the sector value >= total, render circle, not path
                    p = paper.circle(cx, cy, r).attr({ fill: opts.colors && opts.colors[values[i].order] || chartinst.colors[0], stroke: opts.stroke || "#fff", "stroke-width": opts.strokewidth == null ? 1 : opts.strokewidth })
                    
                    //based on if (len == 1) { from line 49 I applied the same here - creating the p2 that later on will
                    //be pushed into covers
                    
                    p2 = paper.circle(cx, cy, r).attr(chartinst.shim);
                    
                    p.customP2 = p2;
                    p.value = values[i];
                    p.middle = {x: cx, y: cy};
                    p.mangle = 180;
                    sectors.push(p);
                    series.push(p);
                    opts.init && p.animate({ path: path.join(",") }, (+opts.init - 1) || 1000, ">");
                }
            }

            for (i = 0; i < len; i++) {
            	if(sectors[i].customP2 === undefined){
                	p = paper.path(sectors[i].attr("path")).attr(chartinst.shim);
            	}
            	else{
            		p = sectors[i].customP2;
            	}
		opts.href && opts.href[i] && p.attr({ href: opts.href[i] });
		p.attr = function () {};
                covers.push(p);
                series.push(p);
            }
        }

        chart.hover = function (fin, fout) {
            fout = fout || function () {};

            var that = this;

            for (var i = 0; i < len; i++) {
                (function (sector, cover, j) {
                    var o = {
                        sector: sector,
                        cover: cover,
                        cx: cx,
                        cy: cy,
                        mx: sector.middle.x,
                        my: sector.middle.y,
                        mangle: sector.mangle,
                        r: r,
                        value: values[j],
                        total: total,
                        label: that.labels && that.labels[j]
                    };
                    
                //taken from https://github.com/dakotareier/g.raphael/blob/3f7517b049c8945ab378072c739bb958f2150b3e/g.pie.js   
            	// Hover modes:
        	// 0 : Callbacks NOT triggered on hover
                // 1 : Callbacks triggered on hover over SECTOR ONLY
                // 2 : Callbacks triggered on hover over BOTH LABEL AND SECTOR
                // 3 : Callbacks triggered on hover over LABEL ONLY
                if (typeof(opts.hovermode) === 'undefined') 
                	opts.hovermode = 1; // for backwards compatibility
                
                if (opts.hovermode && opts.hovermode < 3) {
                    cover.mouseover(function () {
                        fin.call(o);
                    }).mouseout(function () {
                        fout.call(o);
                    });
                }
                    
                if (opts.hovermode && opts.hovermode > 1) {
                    that.labels[j].mouseover(function () {
                        fin.call(o);
                    }).mouseout(function () {
                        fout.call(o);
                    });
                }
			                   
                   
                })(series[i], covers[i], i);
            }
            return this;
        };

        // x: where label could be put
        // y: where label could be put
        // value: value to show
        // total: total number to count %
        chart.each = function (f) {
            var that = this;

            for (var i = 0; i < len; i++) {
                (function (sector, cover, j) {
                    var o = {
                        sector: sector,
                        cover: cover,
                        cx: cx,
                        cy: cy,
                        x: sector.middle.x,
                        y: sector.middle.y,
                        mangle: sector.mangle,
                        r: r,
                        value: values[j],
                        total: total,
                        label: that.labels && that.labels[j]
                    };
                    f.call(o);
                })(series[i], covers[i], i);
            }
            return this;
        };

        chart.click = function (f) {
            var that = this;

            for (var i = 0; i < len; i++) {
                (function (sector, cover, j) {
                    var o = {
                        sector: sector,
                        cover: cover,
                        cx: cx,
                        cy: cy,
                        mx: sector.middle.x,
                        my: sector.middle.y,
                        mangle: sector.mangle,
                        r: r,
                        value: values[j],
                        total: total,
                        label: that.labels && that.labels[j]
                    };
                    cover.click(function () { f.call(o); });
                })(series[i], covers[i], i);
            }
            return this;
        };

        chart.inject = function (element) {
            element.insertBefore(covers[0]);
        };

        var legend = function (labels, otherslabel, mark, dir) {
            var x = cx + r + r / 5,
                y = cy,
                h = y + 10;

            labels = labels || [];
            dir = (dir && dir.toLowerCase && dir.toLowerCase()) || "east";
            mark = paper[mark && mark.toLowerCase()] || "circle";
            chart.labels = paper.set();

            for (var i = 0; i < len; i++) {
                var clr = series[i].attr("fill"),
                    j = values[i].order,
                    txt;

                values[i].others && (labels[j] = otherslabel || "Others");
                labels[j] = chartinst.labelise(labels[j], values[i], total);
                chart.labels.push(paper.set());
                
                //used when a tolltip used (and its source is the legend data) and there 
                //is not enough place to display the legend
                if(opts.show_legend === false){
                    chart.labels[i].push(paper[mark](x + 5, h, 5).attr({ fill: clr, stroke: "none" ,r:0}));
    	            chart.labels[i].push(txt = paper.text(x + 20, h, labels[j] || values[j]).attr(chartinst.txtattr).attr({ fill: opts.legendcolor || "#000", "text-anchor": "start","font-size" : 0}));
		}
                else{
                    //reduced the area between the legend and the little circles
                    chart.labels[i].push(paper[mark](x - 7, h, 5).attr({ fill: clr, stroke: "none" }));
		    chart.labels[i].push(txt = paper.text(x + 3, h, labels[j] || values[j]).attr(chartinst.txtattr).attr({ fill: opts.legendcolor || "#000", "text-anchor": "start"}));
		}
                covers[i].label = chart.labels[i];
                h += txt.getBBox().height * 1.2;
            }

            var bb = chart.labels.getBBox(),
                tr = {
                    east: [0, -bb.height / 2],
                    west: [-bb.width - 2 * r - 20, -bb.height / 2],
                    north: [-r - bb.width / 2, -r - bb.height - 10],
                    south: [-r - bb.width / 2, r + 10]
                }[dir];

            chart.labels.translate.apply(chart.labels, tr);
            chart.push(chart.labels);
        };

        if (opts.legend) {
            legend(opts.legend, opts.legendothers, opts.legendmark, opts.legendpos);
        }

        chart.push(series, covers);
        chart.series = series;
        chart.covers = covers;

        return chart;
    };
    
    //inheritance
    var F = function() {};
    F.prototype = Raphael.g;
    Piechart.prototype = new F;
    
    //public
    Raphael.fn.piechart = function(cx, cy, r, values, opts) {
        return new Piechart(this, cx, cy, r, values, opts);
    }
    
})();
