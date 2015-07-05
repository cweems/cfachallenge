var dataTable = {
	parseData: function(){
		var places = {};
		//Get tracts.txt file (formatted as tsv)
		d3.tsv("tracts.txt", function(error, data) {
		    data.forEach(function(d) {
		    	//Build places object from individual census tracts
		    	tract = Number(d['Tract']);
		    	placeFIPS = Number(d["Place FIPS"]);
		    	//Convert tsv values from string to number for addition
	    		var tractPopulation = Number(d["Population"]),
	    			tractArea = Number(d["Land Area"]),
	    			tractHouses = Number(d["Housing Units"]);
		    	if (places.hasOwnProperty(placeFIPS) === false) {
		    		//If object property doesn't already exist, create it and add properties
		    		places[placeFIPS] = {};
		    		places[placeFIPS]['population'] = tractPopulation;
		    		places[placeFIPS]['area'] = tractArea;
		    		places[placeFIPS]['houses'] = tractHouses;
		    	} else {
		    		//If object already has property, add the current tract's value to that property
		    		places[placeFIPS]['population'] = places[placeFIPS]['population'] + tractPopulation;
		    		places[placeFIPS]['area'] = places[placeFIPS]['area'] + tractArea;
		    		places[placeFIPS]['houses'] = places[placeFIPS]['houses'] + tractHouses;
		    	}
			});
			//Call calcDensity and pass in our places object
			dataTable.calcDensity(places);
		});
	},
	//Use data in the places object to calculate the population and housing densities of the census places
	calcDensity: function(places){
		findDensity = function(places, newAttributeName, dataSourceAttribute){
			var squareMiles = 0;
			for(var i in places){
				if(places.hasOwnProperty(i)) {
					//Convert square meters to square miles
					squareMiles = (places[i]['area'] / 2589988);
					places[i][String(newAttributeName)] = Math.round((places[i][String(dataSourceAttribute)] / squareMiles));
				}
			}
			return places;
		};
		//Call our findDensity function passing in parameters to add housing and population densities to our places object
		var popDensity = findDensity(places, 'popDensity', 'population');
		var houseDensity = findDensity(places, 'houseDensity', 'houses');
		this.maxMin(places);
	},
	//Find census places with highest and lowest population and housing densities
	maxMin: function(places){
		var calculateMax = function(dataSourceAttribute, dataTargetAttribute, mostOrLeast, superlativeName){
			var allValues = [];
			for(var i in places){
				if(places.hasOwnProperty(i)){
					if(isNaN(i) === false){
						//Add values to array for easier sorting
						allValues.push(places[i][String(dataSourceAttribute)]);
					}
				}
			}
			if(mostOrLeast === 'most'){
				//Find the highest/lowest value and add it to the places object (used for setting the domain of the color scale)
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
						//If the place has an attribute with the same value as the superlative (could be max or min), then give it a true attribute
						places[i][String(dataTargetAttribute)] = true;
					}
				}
			}
			return places;
		}
		//Lots of parameters but better than lots of for loops
		var mostPeople = calculateMax('popDensity', 'mostPeople', 'most', 'popMax');
		var leastPeople = calculateMax('popDensity', 'leastPeople', 'least', 'popMin');
		var mostHouses = calculateMax('houseDensity', 'mostHouses', 'most', 'housingMax');
		var leastHouses = calculateMax('houseDensity', 'leastHouses', 'least', 'housingMin');

		this.colorScale(places);
	},
	//Create a color scale to shade the table
	colorScale: function(places){
		var defineScale = function(places, classPrefix, scaleValue, minAttribute, maxAttribute){
			var scale = d3.scale.quantize()
	  			.domain([places[minAttribute], places[maxAttribute]])
	  			//Assign the input to one of 10 buckets
	  			.range(d3.range(9).map(function(i) { return classPrefix + i + "-9"; }));
	  		for(var i in places){
	  			if(places.hasOwnProperty(i)){
	  				var scaled = scale(places[i][String(scaleValue)]);
	  				places[i][classPrefix + 'scale'] = scaled;
	  				//Store 0-9 scale category for use when building table
	  			}
	  		}
		}
		var houses = defineScale(places, 'h', 'houseDensity', 'housingMin', 'housingMax');
		var people = defineScale(places, 'p', 'popDensity', 'popMin', 'popMax');

		this.renderTable(places);
	},
	//Build the table
	renderTable: function(places){
		//Intentionally logging out places here so that you can see the structure
		console.log(places);
		for(var i in places){
			if(places.hasOwnProperty(i)){
				//Need to check if the key is a number now that we have superlative values stored in places as well. Not the best way to do this!
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
	}
};

$(document).ready(function(){
	dataTable.parseData();
});