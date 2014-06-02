'use strict';

var nzTeams = ['Central Pulse', 'Northern Mystics', 'Waikato Bay of Plenty Magic', 'Southern Steel', 'Canterbury Tactix'];
var ausTeams = ['New South Wales Swifts', 'Adelaide Thunderbirds', 'Melbourne Vixens', 'West Coast Fever', 'Queensland Firebirds'];



var margin = {
        top: 20,
        right: 40,
        bottom: 30,
        left: 40
    },
    origWidth = 1600,
    origHeight = 700,
    width = origWidth - margin.left - margin.right,
    height = origHeight - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.4);

var y = d3.scale.linear()
    .rangeRound([height, 0]);

var color = d3.scale.ordinal().range(['#98abc5', '#7b6888', '#a05d56', '#d0743c']);

var xAxis = d3.svg.axis().scale(x).orient('bottom');

var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(15)
    .tickFormat(d3.format('.2s'));

var svg = d3.select('.container').append('svg')
    .attr('class', 'graph')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var data;
var initialData;
var currentView;
var viewArg;
var maxYear = 2013;
var minYear = 2008;
var minRound = 1;
var maxRound = 17;
d3.csv('/data/combined.csv', function(error, items) {
    if (error) {
        console.log(error);
    } else {
        _.each(items, function(item) {
            item.AwayScore = parseInt(item.AwayScore);
            item.HomeScore = parseInt(item.HomeScore);
            item.Round = parseInt(item.Round);
            item.Season = parseInt(item.Season);
        });
        initialData = items;
        data = items;
        View.overview();
        setupSliders();
        // d3.select('.year').call(d3.slider().axis(true).min(minYear).max(maxYear).value([minYear, maxYear]).step(1).on("slide", function(evt, value) {
        //     minYear = value[0];
        //     maxYear = value[1];
        //     sliderChange();
        // }));
        // d3.select('.round').call(d3.slider().axis(true).min(minRound).max(maxRound).value([minRound, minRound]).step(1).on("slide", function(evt, value) {
        //     minRound = value[0];
        //     maxRound = value[1];
        //     sliderChange();
        // }));
    }
});

function initializeTeams() {
    var teams = [];
    _.each(nzTeams, function(name) {
        teams.push({
            name: name,
            country: 'nz'
        });
    });
    _.each(ausTeams, function(name) {
        teams.push({
            name: name,
            country: 'nz'
        });
    });
    return teams;
}

var View = {};

View.overview = function(transition) {
    currentView = View.overview;
    cleanUp();
    color.domain(['HomeWins', 'AwayWins', 'AwayLosses', 'HomeLosses']);
    var teams = getOverviewTeams();

    x.domain(teams.map(function(team) {
        return team.name;
    }));

    var range = d3.max(teams, function(team) {
        return Math.max(team.wins[0].y, Math.abs(team.losses[0].y));
    });

    y.domain([-range, range]);

    if (transition) {
        // transitionGraph(teams, 'wins');
        // transitionGraph(teams, 'losses');
    } else {
        createGraph('Wins / Losses');
        renderGraph(teams, 'wins');
        renderGraph(teams, 'losses');
    }

};

View.team = function(team) {
    currentView = View.team;
    viewArg = team;
    cleanUp();
    filterData(function(item){
            return item.HomeTeam === team || item.AwayTeam ===team;
    });

    color.domain(['HomeWins', 'AwayWins', 'AwayLosses', 'HomeLosses']);
    var teams = getOverviewTeams();
    teams = teams.filter(function(item){
        console.log(item.name === team);
            return item.name !== team;
    });
    x.domain(teams.map(function(team) {
        return team.name;
    }));

    var range = d3.max(teams, function(team) {
        return Math.max(team.wins[0].y, Math.abs(team.losses[0].y));
    });

    y.domain([-range, range]);

    createGraph('Wins / Losses against ' + team);
    renderGraph(teams, 'wins');
    renderGraph(teams, 'losses');
    
};

View.country = function(country) {

    currentView = View.country;
    viewArg = country;
};

View.venues = function() {

    currentView = View.venues;
};

View.venue = function(venue) {

    currentView = View.venue;
    viewArg = venue;
};

function getOverviewTeams() {
    var teams = initializeTeams();
    _.each(teams, function(team) {
        team.wins = [0, 0]; // [home, away]
        team.losses = [0, 0]; // [home, away]
    });
    _.each(data, function(item) {
        if (item.HomeScore > item.AwayScore) {
            _.findWhere(teams, {
                name: item.HomeTeam
            }).wins[0]++;
            _.findWhere(teams, {
                name: item.AwayTeam
            }).losses[1]++;
        } else {
            _.findWhere(teams, {
                name: item.HomeTeam
            }).wins[1]++;
            _.findWhere(teams, {
                name: item.AwayTeam
            }).losses[0]++;
        }
    });

    _.each(teams, function(team) {
        team.wins = [{
            y: team.wins[0] + team.wins[1],
            height: team.wins[1],
            name: 'HomeWins'
        }, {
            y: team.wins[1],
            height: 0,
            name: 'AwayWins'
        }];
        team.losses = [{
            y: -(team.losses[0] + team.losses[1]),
            height: -team.losses[1],
            name: 'HomeLosses'
        }, {
            y: -team.losses[1],
            height: 0,
            name: 'AwayLosses'
        }];
    });

    teams = _.sortBy(teams, function(team) {
        return -(team.wins[0].y);
    });
    return teams;
}

function createGraph(label) {
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text(label);

    var legend = svg.selectAll(".legend")
        .data(color.domain().slice())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(40," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {
            return d;
        });
}

function renderGraph(items, selector) {
    var itemObj = svg.selectAll('.name')
        .data(items)
        .enter().append('g')
        .attr('class', 'g')
        .attr('transform', function(item) {
            return 'translate(' + x(item.name) + ',0)';
        });

    itemObj.on('click', function(item) {
        View.team(item.name);
    });

    itemObj.selectAll('rect')
        .data(function(item) {
            return item[selector];
        })
        .enter().append('rect')
        .attr('width', x.rangeBand())
        .attr('y', function(d) {
            return y(Math.max(d.height, d.y));
        })
        .attr('height', function(d) {
            return y(Math.abs(d.height)) - y(Math.abs(d.y));
        })
        .style('fill', function(d) {
            return color(d.name);
        });

    // teams.forEach(function(team, i) {
    //   svg.append("image")
    //   .attr("xlink:href", "logos/" + shortTitles[team] + ".jpg")
    //   .attr("width", IMAGE_SIZE)
    //   .attr("x", i * (IMAGE_SIZE + DIST_BETWEEN_IMAGE))
    //   .attr("y", MAX_BAR_HEIGHT)
    //   .attr("class", "logo")
    //   .attr("id", team)
    //   .on("click", function(d) { drawForOneTeam(this.id); });
    // });
}

// function transitionGraph(items, selector) {
//     // transition axes;
//     var itemObjs = svg.selectAll('.name');
//     console.log(itemObjs);
//     itemObjs.each(function(itemOb, i) {
//         var updatedItem;
//         itemOb.data(function(item) {
//             updatedItem = _.findWhere(items, {
//                 name: item.name
//             });
//             return updatedItem;
//         });
//         itemOb.selectAll('rect')
//             .data(function(d) {
//                 return d[selector];
//             }).transition()
//             .attr('width', x.rangeBand())
//             .attr('y', function(d) {
//                 return y(Math.max(d.height, d.y));
//             })
//             .attr('height', function(d) {
//                 return y(Math.abs(d.height)) - y(Math.abs(d.y));
//             });
//     });
// }

function cleanUp() {
    d3.selectAll('.graph g g').remove();
}


// var Router = Backbone.router.extend({

//         routes: {
//             "*path": "find"
//         },

//         find: function(path) {
//             path = path.split('/');

// })

function setupSliders() {

    d3.select('.year').call(d3.slider().axis(true).min(minYear).max(maxYear).value([minYear, maxYear]).step(1).on("slide", function(evt, value) {
        minYear = value[0];
        maxYear = value[1];
        sliderChange();
    }));
    d3.select('.round').call(d3.slider().axis(true).min(minRound).max(maxRound).value([minRound, maxRound]).step(1).on("slide", function(evt, value) {
        minRound = value[0];
        maxRound = value[1];
        sliderChange();
    }));

    // $( ".year" ).slider({
    //   range: true,
    //   min: minYear,
    //   max: maxYear,
    //   values: [ minYear, maxYear ],
    //   slide: function( event, ui ) {
    //                minYear = ui.value[0];
    //         maxYear = ui.value[1];
    //         sliderChange();
    //   }
    // });

    // $( ".round" ).slider({
    //   range: true,
    //   min: minRound,
    //   max: maxRound,
    //   values: [ minRound, maxRound ],
    //   slide: function( event, ui ) {
    //                minRound = ui.value[0];
    //         maxRound = ui.value[1];
    //         sliderChange();
    //   }
    // });
}

function sliderChange() {
    data = initialData.filter(function(item) {
        return item.Season >= minYear && item.Season <= maxYear && item.Round >= minRound && item.Round <= maxRound;
    });
    currentView(viewArg);
}

function filterData(filterFun){
    data = initialData.filter(function(item) {
        return item.Season >= minYear && item.Season <= maxYear && item.Round >= minRound && item.Round <= maxRound;
    });
    data = data.filter(filterFun);
}