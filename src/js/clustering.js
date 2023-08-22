const clustering = (function() {

    var clusteringCount = 0;

    return {
        nClusters: 5,

        createClustering: function () {
            // console.log("bib")
            console.log(bib)

            //其实是clustercontext和clusterAuthor 就是看在clustering中 是否keyword和Author被选中 
            var clustercontext = $('#context_checkbox').is(':checked');
            var clusterAuthor = $('#author_checkbox').is(':checked');
                                                    // is() 根据括号里的选择器 是否匹配到 返回布尔值
            //选择框
            console.log("clustercontext:",clustercontext)
            console.log("clusterAuthor:",clusterAuthor)

            if (!clustercontext && !clusterAuthor) {
                page.notify('Please select at least one of the clustering criteria checkboxes.', 'error');
                return;
            }
                                            // filteredEntries的对象的keys的长度 , 最多5个
            // console.log("this.nClusters:",this.nClusters)
            // this.nClusters: 聚类的簇数
            this.nClusters = Math.min(Object.keys(bib.filteredEntries).length, this.nClusters);
                                 //传入一个Unicode 变为一个字符  因为一个字符对应一个Unicode
            var clusteringName = String.fromCharCode(65 + clusteringCount);//就是按A、B、C...来作为键

            if (clusteringCount == 0) {
                //聚类的个数
                bib.clusters = {};//集群
                bib.clusterAssignment = {};//集群分配
                bib.clusteringEntityTerms = {};//群集实体术语
            }

            var allTerms = {};
            var docTerms = {};
            $.each(bib.filteredEntries, function (id, entry) {
                // console.log("filteredEntries")
                // 我也不知道过滤了啥 反正好像是所有的数据
                // console.log(bib.filteredEntries)
                // console.log("id")
                // console.log(id)
                //这个id是所有的数据条目的名字 如Beck2016Visual 应该是一个一个的对象 id就是对象的"键"
                docTerms[id] = [];//开始docTerms[id] 是空
                var terms = [];//让terms为空
                if (clusterAuthor && bib.parsedEntries[id].Data) {
                    terms = terms.concat(bib.parsedEntries[id].Data);
                    //concat连接多个数组
                }
                if (clustercontext && bib.parsedEntries[id].context) {
                    terms = terms.concat(bib.parsedEntries[id].context)
                }
                // console.log("bib")
                // console.log(bib.parsedEntries[id].author)
                // console.log("terms")
                // console.log(terms)
                //terms是将context都按逗号分割形成数组 author使用and分割形成数组
                //if (terms.length > 0) {
                //var splitTerms = entry.context.split(/(,\s)+/)

                $.each(terms, function (i, term) {
                    //if (term.indexOf(',') < 0) {
                    //term = term.replace(/\\/g, '').toLowerCase().trim();
                    var category = term.substr(0, term.indexOf(':'));
                    // 
                    // console.log(bib.tagCategories[category])
                    //将键值对形式的“键”留下来 
                    if (!category || !bib.tagCategories[category] || !bib.tagCategories[category]['excludeForSimilarity']) {
                        //category为空   
                        docTerms[id].push(term);
                        allTerms[term] = true;
                    }
                    //}
                    // console.log("bib")
                    // console.log(bib)
                    // console.log(bib.tagCategories[category]['excludeForSimilarity'])
                });
                //}
            });
            //docTerms -- 就是存的authors或者context分割的数组
            bib.clusteringEntityTerms[clusteringName] = docTerms;
            //                        clusteringName -- A / B / C......
            
            var labels = [];
            var vectors = [];
            var i = 0;
            $.each(docTerms, function (id, terms) {
        //这个id就是大数据的键 如   "Beck2016Visual"
                // console.log(allTerms)   //就是上面的数组内容作为键 true/false作为 值
                labels[i] = id;
                vectors[i] = [];
                var j = 0;
                for (var term in allTerms) {
                    //发现term是allTerms的键
                    console.log(allTerms)
                    console.log(term)
                    vectors[i][j] = terms.indexOf(term) >= 0 ? 1 : 0;
                    j++;
                }
                i++;
            });

            // console.log(this.nClusters, vectors)
            var clusters = window.figue.kmeans(this.nClusters, vectors);

            bib.clusters[clusteringName] = {};
            console.log(clusters)
            $.each(clusters.centroids, function (i, centroid) {
                var cluster = {};
                var maxTerms = [];
                while (maxTerms.length < centroid.length / 20) {
                    var max = 0;
                    var currentMaxTerms = [];
                    $.each(centroid, function (j, value) {
                        if (maxTerms.indexOf(j) < 0) {
                            if (value > max) {
                                max = value;
                                currentMaxTerms = [];
                            }
                            if (value >= max) {
                                currentMaxTerms.push(j);
                            }
                        }
                    });
                    $.merge(maxTerms, currentMaxTerms);
                }
                var terms = [];
                $.each(maxTerms, function (i, j) {
                    terms.push(Object.keys(allTerms)[j] + ' (' + centroid[j].toFixed(2) + ')');
                });
                clustering.terms = terms;
                bib.clusters[clusteringName][i + 1] = cluster;
            });

            $.each(clusters.assignments, function (i, clusterID) {
                var id = labels[i];
                if (!bib.clusterAssignment[id]) {
                    bib.clusterAssignment[id] = [];
                }
                bib.clusterAssignment[id].push(clusteringName + '.' + (clusterID + 1));
            });


            clusteringCount++;
        },


        updateClusters: function () {
        
            if (!bib.clusterAssignment) {
                return   
            }
            
            var clusterSelectorSimilarities = {};
            var clusterSizes = {};
            var clusterTermFrequencies = {};
            var termFrequencies = {};
            var clusterTotalTermFrequency = {};
            $.each(bib.filteredEntries, function (id, field) {
                if (bib.clusterAssignment[id]) {
                    $.each(bib.clusterAssignment[id], function (j, clusterName) {
                        var clusteringName = clusterName.substring(0, 1);
                        if (!clusterSizes[clusterName]) {
                            clusterSizes[clusterName] = 0;
                        }
                        clusterSizes[clusterName]++;
                        if (!clusterSelectorSimilarities[clusterName]) {
                            clusterSelectorSimilarities[clusterName] = [];
                        }
                        $.each(selectors.getSelectors(), function (i, selector) {
                            if (selector && !selector['lock']) {
                                if (!clusterSelectorSimilarities[clusterName][i]) {
                                    clusterSelectorSimilarities[clusterName][i] = 0.0;
                                }
                                clusterSelectorSimilarities[clusterName][i] += bib.entrySelectorSimilarities[id][i];
                            }
                        });
                        $.each(bib.clusteringEntityTerms[clusteringName][id], function (i, term) {
                            if (!clusterTermFrequencies[clusterName]) {
                                clusterTermFrequencies[clusterName] = {};
                            }
                            if (!clusterTermFrequencies[clusterName][term]) {
                                clusterTermFrequencies[clusterName][term] = 0;
                            }
                            clusterTermFrequencies[clusterName][term]++;
                            if (!termFrequencies[term]) {
                                termFrequencies[term] = 0;
                            }
                            termFrequencies[term]++;
                            if (!clusterTotalTermFrequency[clusterName]) {
                                 clusterTotalTermFrequency[clusterName] = 0;
                            }
                            clusterTotalTermFrequency[clusterName]++;
                        });
                    });
                }
            });
            $.each(clusterSizes, function (clusterName, size) {
                $.each(selectors.getSelectors(), function (i, selector) {
                    if (selector && !selector['lock']) {
                        clusterSelectorSimilarities[clusterName][i] /= size;
                    }
                });
            });

            var clusteringsDiv = $('#clusterings');
            clusteringsDiv.empty();
            if (bib.clusters) {
                $.each(bib.clusters, function (clusteringName, clustering) {
                    var clusteringDiv = $('<div>', {
                        class: 'clustering'
                    }).appendTo(clusteringsDiv);
                    var clusteringLabel = $('<span class="label">Clustering ' + clusteringName + ':</h3>').appendTo(clusteringDiv);
                    var closeButton = $('<div>', {
                        class: 'button tooltip small',
                        title: 'discard clustering'
                    }).appendTo(clusteringLabel);
                    $('<span>', {
                        class: 'symbol',
                        text: 'X'
                    }).appendTo(closeButton);
                    closeButton.tooltipster({
                        theme: 'tooltipster-survis'
                    });
                    closeButton.click(function () {
                        delete bib.clusters[clusteringName];
                        page.update();
                    });

                    var termDocumentFrequency = {};
                    $.each(clustering, function (clusterId, cluster) {
                        var clusterName = clusteringName + '.' + clusterId;
                        if (clusterTermFrequencies[clusterName]) {
                            $.each(clusterTermFrequencies[clusterName], function (term, frequency) {
                                if (!termDocumentFrequency[term]) {
                                    termDocumentFrequency[term] = 0;
                                }
                                termDocumentFrequency[term]++;
                            });
                        }
                    });

                    $.each(clustering, function (clusterId, cluster) {

                        var clusterName = clusteringName + '.' + clusterId;
                        if (!clusterSizes[clusterName]) {
                            return;
                        }

                        var tfidf = [];
                        var i = 0;
                        $.each(clusterTermFrequencies[clusterName], function (term, frequency) {
                            var tf = frequency / clusterTotalTermFrequency[clusterName];
                            var idf = Math.log(Object.keys(clustering).length / termDocumentFrequency[term]);
                            tfidf[i] = {
                                name: term,
                                value: tf * idf
                            };
                            i++;
                        });
                        tfidf.sort(function (a, b) {
                            return b.value - a.value;
                        });

                        var clusterDiv = $('<div>', {
                            class: 'tooltip tag authorized ' + tagUtil.getFrequencyClass(clusterSizes[clusterName])
                        }).appendTo(clusteringDiv);
                        var sparklineDiv = $('<div>', {
                            class: 'vis sparkline'
                        }).appendTo(clusterDiv);
                        selectors.vis(sparklineDiv, clusterSelectorSimilarities[clusterName]);
                        $('<span>', {
                            class: 'text',
                            text: clusterName
                        }).appendTo(clusterDiv);
                        $('<span>', {
                            class: 'tag_frequency',
                            text: clusterSizes[clusterName]
                        }).appendTo(clusterDiv);
                        var termsDiv = $('<div>', {
                            class: 'terms'
                        }).appendTo(clusterDiv);
                        for (i = 0; i < Math.min(3, tfidf.length); i++) {
                            $('<div>', {
                                class: 'term',
                                html: latexUtil.latexToHtml(tfidf[i].name)
                            }).appendTo(termsDiv);
                        }
                        clusterDiv.click(function (event) {
                            selectors.toggleSelector('cluster', clusterName, event);
                        });

                        var tooltipDiv = $('<div>');
                        $('<h3><span class="label">cluster: </span>' + clusterName + '</h3>').appendTo(tooltipDiv);
                        $('<div><span class="label"># publications: </span>' + clusterSizes[clusterName] + '</div>').appendTo(tooltipDiv);
                        var termDetailsDiv = $('<div><span class="label">related terms:</span></div>', {
                            class: 'terms'
                        }).appendTo(tooltipDiv);
                        for (i = 0; i < Math.min(10, tfidf.length); i++) {
                            $('<div>', {
                                class: 'term',
                                html: latexUtil.latexToHtml(tfidf[i].name)//+'('+tfidf[i].value.toFixed(3)+')'
                            }).appendTo(termDetailsDiv);
                        }
                        var totalSimilarity = selectors.computeTotalSimilarity(clusterSelectorSimilarities[clusterName]);
                        if (selectors.getNActiveSelectors() > 0) {
                            $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                            if (totalSimilarity > 0) {
                                var visDiv = $('<div>', {
                                    class: 'vis'
                                }).appendTo(tooltipDiv);
                                selectors.vis(visDiv, clusterSelectorSimilarities[clusterName]);
                            }
                        }
                        clusterDiv.tooltipster({
                            content: $(tooltipDiv),
                            theme: 'tooltipster-survis'
                        });
                    });
                });
            }
        }
    }

})();



[
    {"chart": ["pie","circle"]},
    {"layout":[""]}
]