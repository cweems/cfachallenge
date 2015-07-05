var dataTable = {
	parseData: function(){
		var	places = {};
		d3.tsv("tracts.txt", function(error, data) {
		    data.forEach(function(d) {
		    	tract = Number(d['Tract']);
		    	placeFIPS = Number(d["Place FIPS"]);
	    		var tractPopulation = Number(d["Population"]),
	    			tractArea = Number(d["Land Area"]),
	    			tractHouses = Number(d["Housing Units"]);
		    	if (places.hasOwnProperty(placeFIPS) === false) {
		    		places[placeFIPS] = {};
		    		places[placeFIPS]['tracts'] = [];
		    		places[placeFIPS]['tracts'].push(tract);
		    		places[placeFIPS]['population'] = tractPopulation;
		    		places[placeFIPS]['area'] = tractArea;
		    		places[placeFIPS]['houses'] = tractHouses;
		    	} else {
		    		places[placeFIPS]['tracts'].push(tract);
		    		places[placeFIPS]['population'] = places[placeFIPS]['population'] + tractPopulation;
		    		places[placeFIPS]['area'] = places[placeFIPS]['area'] + tractArea;
		    		places[placeFIPS]['houses'] = places[placeFIPS]['houses'] + tractHouses;
		    	}
			});
			dataTable.calcDensity(places);
		});
	},
	calcDensity: function(places){
		findDensity = function(places, newAttributeName, dataSourceAttribute){
			var squareMiles = 0;
			for(var i in places){
				if(places.hasOwnProperty(i)) {
					squareMiles = (places[i]['area'] / 2589988);
					places[i][String(newAttributeName)] = Math.round((places[i][String(dataSourceAttribute)] / squareMiles));
				}
			}
			return places;
		};
		var popDensity = findDensity(places, 'popDensity', 'population');
		var houseDensity = findDensity(places, 'houseDensity', 'houses');
		this.maxMin(places);
	},
	maxMin: function(places){ 
		var CalculateMax = function(dataSourceAttribute, dataTargetAttribute, mostOrLeast, superlativeName){
			var allValues = [];
			for(var i in places){
				if(places.hasOwnProperty(i)){
					if(isNaN(i) === false){
						allValues.push(places[i][String(dataSourceAttribute)]);
					}
				}
			}
			if(mostOrLeast === 'most'){
				var superlative = Math.max.apply(Math, allValues);
				places[String(superlativeName)] = superlative;
			} else if (mostOrLeast === 'least'){
				var superlative = Math.min.apply(Math, allValues);
				places[String(superlativeName)] = superlative;
			} else {
				console.log("Wrong parameter mostOrLeast in calculateMax")
			}
			for(var i in places){
				if(places.hasOwnProperty(i)){
					if(places[i][String(dataSourceAttribute)] === superlative){
						places[i][String(dataTargetAttribute)] = true;
					}
				}
			}
			return places;
		}

		var mostPeople = new CalculateMax('popDensity', 'mostPeople', 'most', 'popMax');
		var leastPeople = new CalculateMax('popDensity', 'leastPeople', 'least', 'popMin');
		var mostHouses = new CalculateMax('houseDensity', 'mostHouses', 'most', 'housingMax');
		var leastHouses = new CalculateMax('houseDensity', 'leastHouses', 'least', 'housingMin');

		this.colorScale(places);
	},
	colorScale: function(places){
		var defineScale = function(places, classPrefix, scaleValue, minAttribute, maxAttribute){
			var scale = d3.scale.quantize()
	  			.domain([places[minAttribute], places[maxAttribute]])
	  			.range(d3.range(9).map(function(i) { return classPrefix + i + "-9"; }));
	  		for(var i in places){
	  			if(places.hasOwnProperty(i)){
	  				var scaled = scale(places[i][String(scaleValue)]);
	  				places[i][classPrefix + 'scale'] = scaled;
	  			}
	  		}
		}
		var houses = defineScale(places, 'h', 'houseDensity', 'housingMin', 'housingMax');
		var people = defineScale(places, 'p', 'popDensity', 'popMin', 'popMax');

		this.renderTable(places);
	},
	renderTable: function(places){
		for(var i in places){
			if(places.hasOwnProperty(i)){
				if(isNaN(i) ===  false){
					$("<tr id=" + i + "><td class='place'>" + i + "</td><td class='housingDensity " + places[i]['hscale'] + "'>" + places[i]["houseDensity"] + "</td><td class='populationDensity " + places[i]['pscale'] + "'>" + places[i]["popDensity"] + "</td>").appendTo('#dataTable');
					if(places[i]['mostPeople'] === true){
						$('#'+ i + ' .populationDensity').append(' - Highest Population Density');
					}
					if(places[i]['leastPeople'] === true){
						$('#'+ i + ' .populationDensity').append('  - Lowest Population Density');
					}
					if(places[i]['mostHouses'] === true){
						$('#'+ i + ' .housingDensity').append('  - Highest Housing Density');
					}
					if(places[i]['leastHouses'] === true){
						$('#'+ i + ' .housingDensity').append('  - Lowest Housing Density');
					}
				}
			}
		}
		this.renderMap(places);
	}
};

$(document).ready(function(){
	dataTable.parseData();
});