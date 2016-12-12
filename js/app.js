// set up SVG for D3
var width = 400,
    height = 400,
    colors = d3.scale.category10();

var svg = d3.select('div#graph')
    .append('svg')
    .attr('oncontextmenu', 'return false;')
    .attr('width', width)
    .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [
        {id: 1, reflexive: false, x: 100, y: 300, fixed: true},
        {id: 2, reflexive: false, x: 200, y: 300, fixed: true},
        {id: 3, reflexive: false, x: 300, y: 300, fixed: true},
        {id: 4, reflexive: false, x: 100, y: 200, fixed: true},
        {id: 5, reflexive: false, x: 200, y: 200, fixed: true},
        {id: 6, reflexive: false, x: 300, y: 200, fixed: true},
        {id: 7, reflexive: false, x: 100, y: 100, fixed: true},
        {id: 8, reflexive: false, x: 200, y: 100, fixed: true},
        {id: 9, reflexive: false, x: 300, y: 100, fixed: true}
    ],
    lastNodeId = 9,
    links = [
        {source: nodes[0], target: nodes[3], left: false, right: true},
        {source: nodes[0], target: nodes[1], left: true, right: false},
        {source: nodes[1], target: nodes[2], left: true, right: false},
        {source: nodes[1], target: nodes[4], left: false, right: true},
        {source: nodes[5], target: nodes[8], left: false, right: true},
        {source: nodes[6], target: nodes[7], left: true, right: false},
        {source: nodes[7], target: nodes[8], left: true, right: false},
        {source: nodes[4], target: nodes[5], left: true, right: false},
        {source: nodes[3], target: nodes[4], left: true, right: false},
        {source: nodes[4], target: nodes[7], left: false, right: true},
        {source: nodes[2], target: nodes[5], left: false, right: true},
        {source: nodes[3], target: nodes[6], left: false, right: true}
    ],
    actualLinks = [];

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .on('tick', tick);

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow-actual')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'rgba(41,41,41,1)');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow-actual')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', 'rgba(41,41,41,1)');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow-dotted')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#e67e22');

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#c8c8c8');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#c8c8c8');

// define hover arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow-hover')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#383838');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow-hover')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#383838');
// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'dotted dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var actualPath = svg.append('svg:g').selectAll('path'),
    path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null,
    hover_link = null;

function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function (d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });
    actualPath.attr('d', function (d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    }).classed("fixed", function (d) {
        return d.fixed === true;
    });
}

// update graph (called when needed)
function restart() {
    // path (link) group
    path = path.data(links);
    actualPath = actualPath.data(actualLinks);
    // update existing links
    /*path.style('marker-start', function(d) { return d.left && d !== hover_link ? 'url(#start-arrow)' : ''; })
     .style('marker-end', function(d) { return d.right && d !== hover_link ? 'url(#end-arrow)' : ''; });*/

    // add new links
    path.enter().append('svg:path');
    /*.style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
     .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });*/

    path.classed('link', function (d) {
        return d !== hover_link;
    })
        .classed('selected', function (d) {
            return d === selected_link;
        })
        .classed('hover', function (d) {
            return d === hover_link;
        })
        .style('marker-start', function (d) {
            return d.left && d !== hover_link ? 'url(#start-arrow)' : d.left && d === hover_link ? 'url(#start-arrow-hover)' : '';
        })
        .style('marker-end', function (d) {
            return d.right && d !== hover_link ? 'url(#end-arrow)' : d.right && d === hover_link ? 'url(#end-arrow-hover)' : '';
        })
        .on('mouseenter', function (d) {
            hover_link = d;
            restart();
        })
        .on('mouseout', function () {
            hover_link = null;
            restart();
        }).on('mousedown', function (d) {
        if (d3.event.ctrlKey) return;

        // select link
        mousedown_link = d;
        selected_link = d;
        selected_node = null;

        var one_dir = true;
        actualLinks.map(function (l) {
            if (mousedown_link.right === l.right && mousedown_link.target.id === l.source.id || mousedown_link.left === l.left && mousedown_link.source.id === l.target.id) {
                one_dir = true;
                //showError('Sorry, one node can have only one outbound and one inbound path.');
            } else if (mousedown_link.target.id === l.source.id || mousedown_link.source.id === l.target.id) {
                one_dir = false;
                showError('Sorry, one node can have only one outbound and one inbound path.');
            }
        });
        if (one_dir) {
            //selected_link = mousedown_link;
            actualLinks.push(mousedown_link);
            links.splice(links.indexOf(mousedown_link), 1)
        }
        restart();
    });


    // remove old links
    path.exit().remove();

    actualPath.classed('actual', true)
        .classed('selected', function (d) {
            return d === selected_link;
        })
        .style('marker-start', function (d) {
            return d.left ? 'url(#start-arrow-actual)' : '';
        })
        .style('marker-end', function (d) {
            return d.right ? 'url(#end-arrow-actual)' : '';
        });

    actualPath.enter().append('svg:path')
        .attr('class', 'actual')
        .classed('selected', function (d) {
            return d === selected_link;
        })
        .style('marker-start', function (d) {
            return d.left ? 'url(#start-arrow-actual)' : '';
        })
        .style('marker-end', function (d) {
            return d.right ? 'url(#end-arrow-actual)' : '';
        })
        .on('mousedown', function (d) {
            if (d3.event.ctrlKey) return;

            // select link
            mousedown_link = d;
            if (mousedown_link === selected_link) selected_link = null;
            else selected_link = mousedown_link;
            selected_node = null;

            restart();
        });
    actualPath.exit().remove();


    // add new links


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function (d) {
        return d.id;
    });
    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .style('fill', function (d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .classed('reflexive', function (d) {
            return d.reflexive;
        });

    // add new nodes
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 12)
        .style('fill', function (d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .style('stroke', function (d) {
            return d3.rgb(colors(d.id)).darker().toString();
        });
        /*.classed('reflexive', function (d) {
            return d.reflexive;
        })*/
       /* .on('mouseover', function (d) {
            if (!mousedown_node || d === mousedown_node) return;
            // enlarge target node
            //d3.select(this).attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function (d) {
            if (!mousedown_node || d === mousedown_node) return;
            // unenlarge target node
            //d3.select(this).attr('transform', '');
        })*/
/*        .on('mousedown', function (d) {
            if (d3.event.ctrlKey) return;

            // select node
            mousedown_node = d;
            if (mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;

            // reposition drag line
            /!*drag_line
                .style('marker-end', 'url(#end-arrow-dotted)')
                .classed('hidden', false)
                .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);*!/

            restart();
        })
        .on('mouseup', function (d) {
            if (!mousedown_node) return;

            // needed by FF
            /!*drag_line
                .classed('hidden', true)
                .style('marker-end', '');*!/

            // check for drag-to-self
            mouseup_node = d;
            if (mouseup_node === mousedown_node) {
                resetMouseVars();
                return;
            }

            // unenlarge target node
            d3.select(this).attr('transform', '');

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target, direction;
            if (mousedown_node.id < mouseup_node.id) {
                source = mousedown_node;
                target = mouseup_node;
                direction = 'right';
            } else {
                source = mouseup_node;
                target = mousedown_node;
                direction = 'left';
            }

            var link;
            link = links.filter(function (l) {
                return (l.source === source && l.target === target && l.left === (direction === 'left'));
            })[0];
            /!*if(link) {
             //link[direction] = true;
             actualLinks.map(function (l) {
             /!* if(link.target.id === (link.left === l.left)? l.target.id:l.source.id){
             one_dir = false;
             }*!/
             if(mousedown_node.id === (l.right ? l.source.id: l.target.id) || mouseup_node.id === (l.right?l.target.id : l.source.id)){
             one_dir = false;
             showError('Sorry, one node can have only one outbound and one inbound path.');
             }
             });
             if(one_dir){
             actualLinks.push(link);
             links.splice(links.map(function(link){return link.source === source && link.target === target}).indexOf(true),1);
             }
             }else{
             showError('Sorry, path is not possible.');
             }*!/

            // select new link
            /!*selected_link = link;*!/
            selected_node = null;
            restart();
        });*/

    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function (d) {
            return d.id;
        });

    // remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.start();
}

function mousedown() {
    // prevent I-bar on drag
    //d3.event.preventDefault();

    // because :active only works in WebKit?
    svg.classed('active', true);

    if (d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    // insert new node at point
    /* var point = d3.mouse(this),
     node = {id: ++lastNodeId, reflexive: false};
     node.x = point[0];
     node.y = point[1];
     nodes.push(node);*/

    restart();
}

function mousemove() {
    if (!mousedown_node) return;

    // update drag line
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if (mousedown_node) {
        // hide drag line
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');
    }

    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
    var toSplice = actualLinks.filter(function (l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function (l) {
        actualLinks.splice(actualLinks.indexOf(l), 1);
    });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
    d3.event.preventDefault();

    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if (d3.event.keyCode === 17) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if (!selected_node && !selected_link) return;
    switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: // delete
           if (selected_link) {
                links.push(selected_link);
                actualLinks.splice(actualLinks.indexOf(selected_link), 1);
            }
            selected_link = null;
            selected_node = null;
            restart();
            break;
        /*case 66: // B
            if (selected_link) {
                // set link direction to both left and right
                selected_link.left = true;
                selected_link.right = true;
            }
            restart();
            break;
        case 76: // L
            if (selected_link) {
                // set link direction to left only
                selected_link.left = true;
                selected_link.right = false;
            }
            restart();
            break;
        case 82: // R
            if (selected_node) {
                // toggle node reflexivity
                selected_node.reflexive = !selected_node.reflexive;
            } else if (selected_link) {
                // set link direction to right only
                selected_link.left = false;
                selected_link.right = true;
            }
            restart();
            break;*/
    }
}

function keyup() {
    lastKeyDown = -1;

    // ctrl
    if (d3.event.keyCode === 17) {
        circle
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
        svg.classed('ctrl', false);
    }
}

// app starts here
svg.on('mousemove', mousemove);
svg.on('mouseup', mouseup);
svg.on('mousedown', mousedown);
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
restart();

function showError(msg) {
    var error = document.querySelector('#error');
    error.style.opacity = 1;
    error.innerHTML = msg;
    setTimeout(function () {
        error.style.opacity = 0;
    }, 3000);
}