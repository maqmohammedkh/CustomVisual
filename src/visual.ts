module powerbi.extensibility.visual {

    interface BarChartViewModel {
        dataPoints: BarChartDataPoints[];
        dataMax: number;
        dataMin: number;
        settings: BarChartSettings;
    };
    interface BarChartDataPoints {
        mx: number;
        mn: number;
        cen: number;
        category: string;
    };

    interface BarChartSettings {
        enableAxis: {
            my: string;
        },
        xAxis: {
            xlabel: string;
        },
        yAxis: {
            ylabel: string;
        };
    }

    export class Visual implements IVisual {

        private svg: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private barContainer: d3.Selection<SVGElement>;
        private bars: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGAElement>;
        private yAxis: d3.Selection<SVGAElement>;
        private barChartSettings: BarChartSettings;


        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            let svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('barChart', true)

            this.barContainer = svg.append('g')
                .classed('barContainer', true);

            this.xAxis = svg.append('g')
                .classed('Axis', true);

            this.yAxis = svg.append('g')
                .classed('Axis', true);

            this.barChartSettings = {     
                enableAxis: {
                    my: "https://api.myjson.com/bins/i2fm9",
                }, 
                xAxis: {
                    xlabel:"Date",
                }  
                , 
                yAxis: {
                    ylabel:"NPS Score",
                } 
            };    
                
        }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
 
            switch(objectName) {
                case 'enableAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            my: this.barChartSettings.enableAxis.my,
                        },
                            selector: null});
                            break ;

                case 'xAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            xlabel: this.barChartSettings.xAxis.xlabel,
                        },
                            selector: null});
                            break ;
                 case 'yAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            ylabel: this.barChartSettings.yAxis.ylabel,
                        },
                            selector: null});
                            break 
            }; 
            return objectEnumeration
        ;}

    public getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T ): T {
        if (objects) {
            let object = objects[objectName];
            if (object) {
                let property: T = <T>object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }


        public update(options: VisualUpdateOptions) {
        
            this.barChartSettings = {
                 enableAxis:{
                    my: this.getValue(options.dataViews[0].metadata.objects,"enableAxis","my", this.barChartSettings.enableAxis.my),
                }
            ,
            xAxis:{
                    xlabel: this.getValue(options.dataViews[0].metadata.objects,"xAxis","xlabel", this.barChartSettings.xAxis.xlabel),
                }
                ,
            yAxis:{
                    ylabel: this.getValue(options.dataViews[0].metadata.objects,"yAxis","ylabel", this.barChartSettings.yAxis.ylabel),
                }
            }

           
            let query = this.getViewModel(options);
            let url = 'http://AZVOCSTAT01:8085/Home/FetchNPS' + query;

       
            let margin = { top: 3, bottom: 35, left: 42, right: 20 };

            var xhr = new XMLHttpRequest();
            xhr.open('GET', this.barChartSettings.enableAxis.my , false);
            var chartData;
            xhr.onload = function () {
                if (xhr.status === 200) {
                    chartData = JSON.parse(xhr.responseText);
                }
            };
            xhr.send();

            let i: number;
            let testData: BarChartDataPoints[] = new Array();

            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
          
            for (i = 0; i < chartData.length; i++) {
                let v: string = chartData[i]["MonthName"];
                let sp1 = v.split('-');
                let yr = sp1[0];
                let mon: string;
                if (sp1[1].substr(0, 1) == "0")
                    mon = monthNames[parseInt(sp1[1].substr(1, 1)) - 1];
                else
                    mon = monthNames[parseInt(sp1[1].substr(0, 2)) - 1];
                let fy = mon + " FY" + yr.substr(2, 2);
                let nbar = {
                    mx: chartData[i]["High"],
                    mn: chartData[i]["Low"],
                    cen: chartData[i]["NPS"],
                    category: fy
                };
                testData.push(nbar);
            }

            let width = options.viewport.width;
            let height = options.viewport.height;

               
            let viewModel: BarChartViewModel = {
                dataPoints: testData,
                dataMax: d3.max(testData, x => x.mx),
                dataMin: d3.min(testData, x => x.mn),
                settings: this.barChartSettings 
            };

            console.log(viewModel.settings.enableAxis.my) ;

            let settings = this.barChartSettings;

            this.svg.attr({
                width: width,
                height: height
            });

            

            let yScale = d3.scale.linear()
                .domain([viewModel.dataMin - margin.top, viewModel.dataMax + margin.top])
                .range([height - (margin.bottom), 0]);

            let xScale = d3.scale.ordinal()
                .domain(viewModel.dataPoints.map(d => d.category))
                .rangeRoundBands([margin.left, width], 0.0);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            let yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

            this.xAxis.attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
                .call(xAxis);

            this.yAxis.attr("transform", "translate(" + (margin.left) + ",0)")
                .call(yAxis);

            this.xAxis.select('path').remove();
            this.yAxis.select('path').remove();

            this.svg.selectAll('#NPSText').remove();
            this.svg.selectAll('#dateText').remove();
            this.barContainer.selectAll('#GridY').remove();
            this.barContainer.selectAll('#GridX').remove();
            
            this.svg.append("text")
                .attr("x", width / 2)
                .attr("y", height - 1)
                .attr("id", "dateText")
                .attr("font-size", "15")
                .style("text-anchor", "middle")
                .text(this.barChartSettings.xAxis.xlabel);

            this.svg.append("text")
                .attr("transform", "translate(" + (margin.bottom / 2) + "," + (height / 2) + ")rotate(-90)")
                .attr("id","NPSText")
                .style("text-anchor", "middle")
                .attr("font-size", "15")                
                .text(this.barChartSettings.yAxis.ylabel);


            this.svg.selectAll('rect').remove() ;
            this.svg.selectAll('#mainLine').remove();
            this.svg.selectAll('#topLine').remove();
            this.svg.selectAll('#bottomLine').remove();
            this.svg.selectAll('#centreCircle').remove();
            this.svg.selectAll('#minValue').remove();
            this.svg.selectAll('#maxValue').remove();
            this.svg.selectAll('#cenValue').remove();

            this.barContainer.append("rect")
                .attr("class", "grid-background")
                .attr("width", width)
                .attr("height", height - margin.bottom)
                .attr("x", margin.left) ; 
                
            this.barContainer.append("g")
                .attr("class", "grid")
                .attr("id", "GridY")
                .attr("transform", "translate(0," + (height - margin.bottom) + ")")
                .call(d3.svg.axis().scale(xScale).tickSize(-height))
                .classed("minor", true);


           this.barContainer.append("g")
                .attr("class", "grid")
               .attr("id", "GridX")
               .attr("transform", "translate(" + (margin.right) + ",0)")
                .call(d3.svg.axis().scale(yScale).tickSize(-width).orient("left"))
                .classed("minor", true);

       
            let bars = this.barContainer.selectAll('.bar').data(viewModel.dataPoints);
                
            bars.enter()
                .append('line')
                .attr({
                    "x1": d => xScale(d.category) + (width - margin.left) / (2 * testData.length),
                    "y1": d => yScale(d.mn),
                    "x2": d => xScale(d.category) + (width - margin.left) / (2 * testData.length),
                    "y2": d => yScale(d.mx),
                    "stroke-width": 2,
                    "stroke":"#ee7c7b",
                    "shape-rendering": "crispEdges",
                    "id": "mainLine"
                });

            bars.enter().append('line')
                .attr({
                    "x1": d => xScale(d.category) - 15 + (width - margin.left) / (2 * testData.length),
                    "y1": d => yScale(d.mx),
                    "x2": d => xScale(d.category) + 15 + (width - margin.left) / (2 * testData.length),
                    "y2": d => yScale(d.mx),
                    "stroke-width": 2,
                    "stroke": "#ee7c7b",
                    "shape-rendering": "crispEdges",
                    "id": "topLine"
                });

            bars.enter().append('line')
                .attr({
                    "x1": d => xScale(d.category) - 15 + (width - margin.left) / (2 * testData.length),
                    "y1": d => yScale(d.mn),
                    "x2": d => xScale(d.category) + 15 + (width - margin.left) / (2 * testData.length),
                    "y2": d => yScale(d.mn),
                    "stroke-width": 2,
                    "stroke": "#ee7c7b",
                    "shape-rendering": "crispEdges",
                    "id": "bottomLine"
                });

            bars.enter().append('circle')
                .attr({
                    "cx": d => xScale(d.category) + (width - margin.left) / (2 * testData.length),
                    "cy": d => yScale(d.cen),
                    "r": 2,
                    "stroke-width": 2,
                    "stroke": "#ee7c7b",
                    "id": "centreCircle"
                }); 


            var texts = this.svg.selectAll(".bartext")
                .data(testData)
                .enter();

            

            texts.append("text")
                .attr("id", "maxValue")
                .attr("class", "bartext")
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .attr("font-size", 12 * height * 0.0018)
                .attr("x", function (d, i) {
                    return xScale(d.category) + width / (2 * testData.length);
                })
                .attr("y", function (d, i) {
                    return yScale(d.mx + height * 0.002);
                })
                .text(d => d.mx.toFixed(2));

            

           


            texts.append("text")
                 .attr("id", "cenValue")
                 .attr("class", "bartext")
                 .attr("text-anchor", "middle")
                 .attr("font-weight", "bold")
                 .attr("fill", "orange")
                .attr("font-size", 12 * height * 0.0018)
                 .attr("x", function (d, i) {
                    return xScale(d.category) + width / (2 * testData.length) + width/(testData.length*5);
                 })
                 .attr("y", function (d, i) {
                    return yScale(d.cen);
                 })
                .text(d => d.cen.toFixed(2));

             texts.append("text")
                 .attr("id", "minValue")
                 .attr("class", "bartext")
                 .attr("text-anchor", "middle")
                 .attr("fill", "black")
                 .attr("font-size", 12 * height * 0.0018)
                 .attr("x", function (d, i) {
                    return xScale(d.category) + width / (2 * testData.length);
                 })
                .attr("y", function (d, i) {
                    return yScale(d.mn - height * 0.002);
                 })
                 .text(d => d.mn.toFixed(2));

            bars.exit()
                .remove();


    }

       

        private getViewModel(options: VisualUpdateOptions): string {

            let dv = options.dataViews;
            
            if (!dv
                || !dv[0]
                || !dv[0].table
                || !dv[0].table.columns
                || !dv[0].table.rows)
                return null;

            let view = dv[0].table;
            let categories = view.columns[0];
            let values = view.rows[0];
            
            let i: number;


            var str = <string>values[0];
            var splitted = str.split("$|$");

            var mapA = new Object();
            var mapP = new Object();
            var mapI = new Object();
            var mapC = new Object();
            var mapF = new Object();
            var mapR = new Object();
            var mapU = new Object();
            var mapE = new Object();

            var areas =         splitted[0].split(",");
            var products =      splitted[1].split(",");
            var issues =        splitted[2].split(",");
            var countries =     splitted[3].split(",");
            var fiscals =       splitted[4].split(",");
            var rollings =      splitted[5].split(",");
            var uss =           splitted[6].split(",");
            var experiences =   splitted[7].split(",");


            for (i = 0; i < areas.length; i++) {
                mapA[areas[i]] = 1; 
            }
            for (i = 0; i < products.length; i++) {
                mapP[products[i]] = 1;
            }
            for (i = 0; i < issues.length; i++) {
                mapI[issues[i]] = 1;
            }
            for (i = 0; i < countries.length; i++) {
                mapC[countries[i]] = 1;
            }
            for (i = 0; i < fiscals.length; i++) {
                mapF[fiscals[i]] = 1;
            }
            for (i = 0; i < rollings.length; i++) {
                mapR[rollings[i]] = 1;
            }
            for (i = 0; i < uss.length; i++) {
                mapU[uss[i]] = 1;
            }
            for (i = 0; i < experiences.length; i++) {
                mapE[experiences[i]] = 1;
            }


            
            
            let startDate:Date = new Date(Date.now());
            let endDate:Date = new Date(0);
            if(Object.keys(mapF).length === 0 || (Object.keys(mapF).length === 1 && Object.keys(mapF)[0] === "")){
                startDate = new Date(0);
                endDate = new Date(Date.now());
            }
            for(let i:number = 0;i<Object.keys(mapF).length;i++){
                if(startDate > this.getStartDate(<string>Object.keys(mapF)[i])){
                    startDate = this.getStartDate(<string>Object.keys(mapF)[i]);
                }
                if(endDate < this.getEndDate(<string>Object.keys(mapF)[i])){
                    endDate = this.getEndDate(<string>Object.keys(mapF)[i]);
                }
            }


            let query:string = '';
            query  = "?areaList=" + Object.keys(mapA).join(',');
            query += "&countryList=" + Object.keys(mapC).join(',');
            query += "&id=" + Object.keys(mapP).join(',');
            query += "&issue_type=" + Object.keys(mapI).join(',');
            query += "&US_Int_type=" + Object.keys(mapU).join(',');
            query += "&experienced_issue=" + Object.keys(mapE).join(',');
            query += "&rolling13=" + Object.keys(mapR).join(',');
            query += "&timeSlice=Month";
            query += "&startdate=" + startDate.toDateString();
            query += "&enddate=" + endDate.toDateString();
            

            return query;
        }

        public destroy(): void {

        }

        public getStartDate(fiscalYear:string): Date{
                let fYear:number = parseInt(fiscalYear.substr(fiscalYear.length - 2));
                let startDate:Date = new Date();
                startDate.setUTCFullYear(fYear + 2000 - 1);
                startDate.setUTCMonth(7 - 1); //July Month
                startDate.setUTCDate(1);
                return startDate;
        }

        public getEndDate(fiscalYear:string): Date{
                let fYear:number = parseInt(fiscalYear.substr(fiscalYear.length - 2));
                let endDate:Date = new Date();
                endDate.setUTCFullYear(fYear + 2000);
                endDate.setUTCMonth(6 - 1); //June Month
                endDate.setUTCDate(30);
                return endDate;
        }
    }
}
