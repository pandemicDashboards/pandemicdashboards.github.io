const entryLayout = (function () {

    var maxAbstractLength = 300;
    var ID = 0;

    return {
        //更新列表
        updateEntryList: function () { 
            var nVisibleEntries = Math.min(bib.nVisibleEntries, Object.keys(bib.entries).length);
            var resultBodyDiv = $('#result_body');
            resultBodyDiv.find('.entry').hide();

            var j = 0;
            var flag = 0;
            $.each(bib.sortedIDs, function (i, id) {

                //遍历bib中的IDs 
                if (bib.filteredEntries[id] && (j < nVisibleEntries)) {
                    //创建entryDiv （对应的过滤词条存在 且j的大小小于可见的词条数目）
                    if(id == 133 || id == 174 || id == 177 || id == 198 || id == 24 || id == 278 || id == 279 || id == 280 || id == 80){ return true}
                    flag  = flag + 1;
                    // console.log(flag)
                    var entryDiv = createEntryDiv(id,flag);
                    // console.log("1",entryDiv)
                    var sparklineDiv = entryDiv.find('.sparkline');
                    sparklineDiv.empty();
                    // tooltipster是一种插件 应该是设置当前的那个彩色条条状态的
                    sparklineDiv.tooltipster('destroy');
                    //没懂
                    selectors.vis(sparklineDiv, bib.entrySelectorSimilarities[id], true);
                    var tooltipDiv = $('<div>');
                    $('<h3><span class="label">sum: </span>' + id + '</h3>').appendTo(tooltipDiv);
                    var totalSimilarity = selectors.computeTotalSimilarity(bib.entrySelectorSimilarities[id]);
                    
                    if (selectors.getNActiveSelectors() > 0) {
                        //选择器
                        $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                        if (totalSimilarity > 0) {
                            var visDiv = $('<div>', {
                                class: 'vis'
                            }).appendTo(tooltipDiv);
                            selectors.vis(visDiv, bib.entrySelectorSimilarities[id]);
                        }
                    }
                    sparklineDiv.tooltipster({
                        content: tooltipDiv,
                        theme: 'tooltipster-survis'
                    });
                    var greyValue = Math.round(-selectors.getTotalSimilarity(bib, id) * 200 + 200);
                    entryDiv.css('border-color', 'rgb(' + greyValue + ',' + greyValue + ',' + greyValue + ')');
                    
                    if (bib.clusterAssignment && bib.clusterAssignment[id]) {
                        //cluster 存在 就找到对应的cluster
                        var clustersDiv = entryDiv.find('.clusters');
                        if (clustersDiv.length == 0) {
                            clustersDiv = $('<div>', {
                                class: 'clusters'
                            }).insertBefore(entryDiv.find('.footer_container'));
                        }
                        clustersDiv.empty();
                        var nonDiscardedClusters = [];
                        $.each(bib.clusterAssignment[id], function (i, clusterID) {
                            // console.log(clusterID)
                            var clusteringName = clusterID.substring(0, 1);
                            if (bib.clusters[clusteringName]) {
                                nonDiscardedClusters.push(clusterID);
                            }
                        });  
                        // 我猜nonDiscardedClusters 是cluster新创建的
                        if (nonDiscardedClusters.length > 0) {
                            //大于零 就将label --> Cluster 加入到clustersDiv中去
                            $('<div>', {
                                class: 'label',
                                text: 'Cluster'
                            }).appendTo(clustersDiv);
                            $.each(nonDiscardedClusters, function (i, clusterID) {
                                var clusterDiv = $('<div>', {
                                    class: 'cluster',
                                    text: clusterID
                                }).appendTo(clustersDiv);
                                clusterDiv.click(function (event) {
                                    ///// ???????  点一下在右边 create 的 cluster 多了绿条条
                                    selectors.toggleSelector('cluster', clusterID, event);//设置选择器的状态
                                });
                            })
                        }
                    }
                    //取出out和in 的内容
                    var outgoingFrequencySpan = entryDiv.find('.citation_outgoing_frequency');
                    if (outgoingFrequencySpan.length > 0) {
                        outgoingFrequencySpan.text(bib.filteredReferences[id].referencesOutgoing ? bib.filteredReferences[id].referencesOutgoing.length : 0)
                        //.text()  用于html内容的存取 ---> 文本内容 
                    }
                    var incomingFrequencySpan = entryDiv.find('.citation_incoming_frequency');
                    if (incomingFrequencySpan.length > 0) {
                        incomingFrequencySpan.text(bib.filteredReferences[id].referencesIncoming ? bib.filteredReferences[id].referencesIncoming.length : 0)
                    }
                    //将resultBody 存入entryDiv中
                    entryDiv.appendTo(resultBodyDiv);
                    //将entryDiv内容显示
                    entryDiv.show();
                    j++;
                }
            });
            //找到移除active部分
            resultBodyDiv.find('.active').removeClass('active');
            $.each(selectors.getActiveTags('keywords'), function (tag) {
                resultBodyDiv.find('.tag[value="' + tag + '"]').addClass('active');
            });
            $.each(selectors.getActiveTags('author'), function (tag) {
                //左边选择作家 然后右边响应的部分高亮
                var authorValue = tagUtil.simplifyTag(tag);
                resultBodyDiv.find('.author[value="' + authorValue + '"]').addClass('active');
            });
            //移除 more和all的 entries 
            $('#show_more_entries').remove();
            $('#show_all_entries').remove();
            if (nVisibleEntries < Object.keys(bib.entries).length) {
                //bib 中的条款少于规定数量
                //获取按钮 button 插入resultBodyDiv
                var showMoreDiv = $('<div>', {
                    id: 'show_more_entries',
                    class: 'button',
                    text: 'show more'
                }).appendTo(resultBodyDiv);
                showMoreDiv.click(function () {
                    page.updateShowMore();
                    //点击showMoreDiv 进行页面更新
                });
                var showAllDiv = $('<div>', {
                    id: 'show_all_entries',
                    class: 'button',
                    text: 'show all'
                }).appendTo(resultBodyDiv);
                showAllDiv.click(function () {
                    page.updateShowAll();
                    //点击showAllDiv 进行更新
                });
            }
        }
    };
    // 将图片img footer EntryMainDiv 加入到entryDiv  --> 就是右边的div啦 
    function createEntryDiv(id,flag) {
        var entryID = id + "entry"
        if (!bib.entryDivs[id]) {
            // bib 中entryDivs[id] 存在 获取entryDivs
            //所有的数据就在bib.entries[id]中
            var entry = bib.entries[id];
            var entryDiv = $('<div>', {
                class: 'entry type_' + entry['type'],
                id: entryID,
            });
            // console.log(entryDiv)
            //获取div 路径  插入图片
            // console.log(dataDir)
            //dataDir --> data/ 
            var pdfFile = dataDir + 'papers_pdf/' + id + '.pd<f';  
            // console.log(pdfFile) 
            if (typeof bib.availableImg != 'undefined' && bib.availableImg.indexOf(id) >= 0) {
                createImgDiv(id, pdfFile).appendTo(entryDiv);
                //创建图片div
            }
            //用这种形式遍历数组 那item就是对象的key 而不是整个对象
            var ID_text = id + "text"
            var tooltipSpan = $('<div>',{
                class: "tooltipText" ,
                id: ID_text ,
                left:"-40%",
                top: "10px", /* 调整下移的像素值 */
               
            }).appendTo(entryDiv) 
            // $("tooltip").css("z-index","99")
            var id_entry = "#" + entryID 
            var offset = $(id_entry).offset();

            var publisherSpan = $("<span>").css({
                // color: "steelblue",
                  display: "block",
            }).appendTo(tooltipSpan);

              $("<strong>", {
                 text: "Publisher Name:"
            }).appendTo(publisherSpan);
            // continent内容
            $("<span>", {
                    text: entry['publisher_name']
            }).appendTo(publisherSpan);
            //Publisher-Type:
            // var publisherTypeSpan = $("<span>",{
            //     text:"Publisher Type: " + entry['publisher-type']
            // }).css({
            //     // color: "steelblue",
            //     display: "block",
            //   })
            // publisherTypeSpan.css("weight","bold").appendTo(tooltipSpan)
            // //publisher-type内容
            // var div1 = $("<div>",{
            //     text:entry['publisher-type']
            // }).appendTo(tooltipSpan)
            
            var publisheTypeSpan = $("<span>").css({
                // color: "steelblue",
                  display: "block",
            }).appendTo(tooltipSpan);

              $("<strong>", {
                 text: "Publisher Type:"
            }).appendTo(publisheTypeSpan);
            // continent内容
            $("<span>", {
                    text: entry['publisher-type']
            }).appendTo(publisheTypeSpan);
            
            //Publisher-Name:
            // var publisherNameSpan = $("<span>",{
            //     text:"Publisher Name: " + entry['publisher_name']
            // }).css({
            //     // color: "steelblue", 
            //     display: "block",
            //   })
            // publisherNameSpan.css("weight","bold").appendTo(tooltipSpan)
            

            

            // //geo-level:
            // var geoLevelSpan = $("<span>",{
            //     text:"geo-level: " + entry['geo-level']
            // }).css({
            //     // color: "steelblue",
            //     // display: "inline-block",
            //   })
            //   geoLevelSpan.css("weight","bold").appendTo(tooltipSpan)
            //geo-level内容
            // var div_1 = $("<div>",{
            //     text:entry['geo-level']
            // }).appendTo(tooltipSpan)


            var geoLevelSpan = $("<span>").css({
                // color: "steelblue",
                  display: "block",
          }).appendTo(tooltipSpan);

              $("<strong>", {
                 text: "Geo-Level:"
          }).appendTo(geoLevelSpan);
        // continent内容
          $("<span>", {
                    text: entry['geo-level']
          }).appendTo(geoLevelSpan);

             // contient:
                var continentSpan = $("<span>").css({
                      // color: "steelblue",
                        display: "block",
                }).appendTo(tooltipSpan);

                    $("<strong>", {
                       text: "Continent: "
                }).appendTo(continentSpan);
              // continent内容
                $("<span>", {
                          text: entry['continent'] + "\n"
                }).appendTo(continentSpan);

            //Chart-Type：
            var ChartTypeSpan = $("<span>").css({
                // color:"steelblue",
                display :"block",
            }).appendTo(tooltipSpan)
            $("<strong>",{
                text : "Chart Types:"
            }).appendTo(ChartTypeSpan)
            $("<span>",{
                text: entry['VisualForms'].split(',')[0].replace("Encoding:","").replace(/\//g,",")+"\n"
            }).appendTo(ChartTypeSpan)




             //原始归档网站：
             var originalSpan = $("<a>",{
                text:"Original Link， ",
            }).css({
                color: "steelblue",
                display: "inline-block",
              })
            originalSpan.css("font-weight","bold").appendTo(tooltipSpan)
            originalSpan.click(function(){
                window.open(entry["Original_web"])
            })
            
          

            //最新归档网站：
            var newSpan = $("<span>",{
                text:"  Archive Link",
            }).css({
                color: "steelblue",
                display: "inline-block",
              })
            newSpan.css("font-weight","bold").appendTo(tooltipSpan)
            newSpan.click(function(){
                window.open(entry['new_web'])
            })

            // console.log($("#" + id))


            // //设置悬浮窗位置

            

            // var str = ".entry"
            // var str1 =  "#" + ID_text
            // var str2 = "#" + entryID 
            // // $(str2).css("position","")
            // $(str).mouseover(function(){
            //    if(flag % 4 == 0){
            //     $(str1).css("right","20%")
            //     $(str1).css("position","fixed")
            //    }
            // })
            
            var entryClass = 'entry type_' + entry['type'];
            // $("#tooltipText").append("<span style='color:steelblue;'>publisher-type: </span>")
            // console.log(typeof(entryDiv)) 
            //创建EntryMainDiv 
            createEntryMainDiv(id).appendTo(entryDiv);
            //创建Footer
            // createFooter(id, entry).appendTo(entryDiv);
            bib.entryDivs[id] = entryDiv;
            //在页面生成tooltips
            page.generateTooltips(bib.entryDivs[id]);
        }
        //返回entryDiv
        return bib.entryDivs[id];
    }

    //获取右边的entry_main 部分的div 将Links Header title author abstract tag 插入
    function createEntryMainDiv(id) {
        var entry = bib.entries[id];
        var pdfFile = dataDir + 'papers_pdf/' + id + '.pdf';
        var entryMainDiv = $('<div>', {
            "class": 'entry_main',

        });

        //获取右边的entry_main 部分的div将Links Header title author abstract tag 插入
        // createLinksDiv(id, entry, pdfFile).appendTo(entryMainDiv);
        // createEntryHeaderDiv(id, entry).appendTo(entryMainDiv);
        // createTitleDiv(id, entry, pdfFile).appendTo(entryMainDiv);
        // createAuthors(entry['author']).appendTo(entryMainDiv);
        // console.log("entry")
        // console.log(entry)
        // createAbstract(entry['abstract'], true).appendTo(entryMainDiv);
        // createTags(id).appendTo(entryMainDiv);
        // if (entry['comment']) {
        //     createComment(entry['comment']).appendTo(entryMainDiv);
        // }
        //来创建一个publisher     
        // createPublishers(entry["publisher"]).appendTo(entryMainDiv);
        return entryMainDiv;
    }
    //创建linksDiv
    function createLinksDiv(id, entry, pdfFile) {
        var linksDiv = $('<div>', {
            class: 'links'
        });
        if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0) {
            $('<a>', {
                href: pdfFile,
                target: '_blank',
                text: 'PDF'
            }).appendTo(linksDiv);
        }
        if (entry['video']) {
            $('<a>', {
                href: entry['video'],
                target: '_blank',
                text: 'Video'
            }).appendTo(linksDiv);
        }
        if (entry['doi']) {
            $('<a>', {
                href: 'http://dx.doi.org/' + entry['doi'],
                target: '_blank',
                text: 'DOI'
            }).appendTo(linksDiv);
        }
        if (entry['url']) {
            $('<a>', {
                href: entry['url'],
                target: '_blank',
                text: 'URL'
            }).appendTo(linksDiv);
        }
        $('<a>', {
            //encodeURIComponent()函数通过将一个，两个，三个或四个表示字符的 UTF-8 编码的转义序列替换某些字符的每个实例来编码 URI
            href: 'http://scholar.google.de/scholar?hl=en&q=' + encodeURIComponent(entry.title),
            target: '_blank',
            text: 'Google Scholar'
        }).appendTo(linksDiv);
        $('<a>', {
            href: 'https://www.google.de/search?q=' + encodeURIComponent(entry.title),
            target: '_blank',
            text: 'Google'
        }).appendTo(linksDiv);
        $('<a>', {
            href: 'https://search.cro   ssref.org/?q=' + (entry.doi ? entry.doi : encodeURIComponent(entry.title)),
            target: '_blank',
            text: 'CrossRef'
        }).appendTo(linksDiv);
        return linksDiv;
    }
    // 创建右边div 的头部
    function createEntryHeaderDiv(id, entry) {
        var entryHeaderDiv = $('<div>', {
            class: 'entry_header'
        });
        //这个sparkline就是 那些条条
        var sparklineDiv = $('<div>', {
            class: 'vis sparkline'
        }).appendTo(entryHeaderDiv);
        //应该在设置那些条条
        sparklineDiv.tooltipster({ 'content': $('<div>') });
        var idDiv = $('<div>', {
            class: 'id',
            text: id
        }).appendTo(entryHeaderDiv);
        idDiv.click(function () {
            //点击了id就反向选中了元素
            selectElementText(this);
        });
        var series = entry['series'];
        if (!series) {
            //series 不为空 就按照条件(entry)来为series赋值
            if (entry['type'] == 'article') {
                //查看选中的是否article类型
                series = entry['journal'];
            } else {
                series = '[' + entry['type'] + ']'
            }
        }
       //获取serise(TVCG)类 ---> div
        var seriesDiv = $('<div>', {
            class: 'series',
            text: latexUtil.latexToHtml(series)
            // 将series的内容转换为html --> text
        }).appendTo(entryHeaderDiv);  
        
        seriesDiv.click(function (event) {
            // 点击就触发xxx 
            selectors.toggleSelector('series', series, event);
        });
        var yearDiv = $('<div>', {
            class: 'year',
            text: '(' + entry['year'] + ')'
        // 获取年份 插入右边的头部部分
        }).appendTo(entryHeaderDiv);
        yearDiv.click(function (event) {
            
            selectors.toggleSelector('year', entry['year'], event);
        });
        return entryHeaderDiv;
    }
    //创建title div
    function createTitleDiv(id, entry, pdfFile) {
        if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0 || entry['doi'] || entry['url']) {
            // 存在pdf 存在链接
            return $("<a>", {
                class: "title",
                html: latexUtil.latexToHtml(entry["title"]),
                target: '_blank',
                href: bib.availablePdf.indexOf(id) >= 0 ? pdfFile : (entry['doi'] ? 'http://dx.doi.org/' + entry['doi'] : entry['url'])
            });
        } else {
            return $("<div>", {
                class: "title",
                html: latexUtil.latexToHtml(entry["title"])
            });
        }
    }
    //分author的名字---> 是否有first name 和 last name 来确定 创造div
    function createAuthors(authors) {
        // console.log("authors")
        // console.log(authors)
        if (!authors) {
            // authors不存在
            return $('<div>', {
                'text': '[unknown authors]',
                'class': 'author unknown'
            });
        }

        var authorsDiv = $("<div>", {
            class: "authors"
        });
        $.each(authors.split(" and "), function (i, author) {
            var authorSplit = author.split(",");
            if (authorSplit.length == 2) {
                var authorDiv = $("<div>", {
                    class: "author",
                    value: tagUtil.simplifyTag(author)
                }).appendTo(authorsDiv);
                authorDiv.click(function (event) {
                    selectors.toggleSelector('author', tagUtil.simplifyTag(author), event);
                });
                $("<span>", {
                    class: "last_name",
                    html: latexUtil.latexToHtml(authorSplit[0])
                }).appendTo(authorDiv);
                $("<span>", {
                    class: "first_name",
                    html: ", " + latexUtil.latexToHtml(authorSplit[1])
                }).appendTo(authorDiv);
            } else {
                $.each(authorSplit, function (j, author2) {
                    authorDiv = $("<div>", {
                        class: "author",
                        value: tagUtil.simplifyTag(author2)
                    }).appendTo(authorsDiv);
                    authorDiv.click(function (event) {
                        selectors.toggleSelector('author', tagUtil.simplifyTag(author2), event);
                    });
                    $("<span>", {
                        class: "name",
                        html: latexUtil.latexToHtml(author2)
                    }).appendTo(authorDiv);
                });
            }
        });
        return authorsDiv;
    }
    //创建publisher
    function createPublishers(publisher){
        if(!publisher){
            return $('<div>',{
                'text' : '[unkonwn publisher]',
                'class' : 'publisher unknown',
            });
        } 
        var publisherDiv = $("<div>",{
            class : "publisher",  
            text : "publisher: "+tagUtil.simplifyTag(publisher)
        })
        publisherDiv.click(function (event){
            selectors.toggleSelector("publisher",tagUtil.simplifyTag(publisher),event);
        });
        return publisherDiv;

        
    }   
    //文本处理
    function createAbstract(text, shorten) {
        if (text) {
            // 文本不为空 转换为 html文本
            text = latexUtil.latexToHtml(text);
            var abstractDiv = $("<div>", {
                class: 'abstract' + (shorten ? ' collapsed' : ''),
                text: (shorten ? shortenText(text, maxAbstractLength) : text),
                value: text
            });
            if (shorten && text.length != abstractDiv.text().length) {
                $("<span>", {
                    class: 'expand',
                    text: " > "
                }).appendTo(abstractDiv);
            }
            $("<span>", {
                class: "label",
                text: "Abstract: "
            }).prependTo(abstractDiv);
            abstractDiv.click(function () {
                var value = $(this).attr('value');
                var collapsed = $(this).hasClass('collapsed');
                $(this).replaceWith(createAbstract(value, !collapsed));
            });
            return abstractDiv;
        }
        return $('');
    }

    function createTags(id) {
        function createTagList(id) {
            var tagListSpan = $("<span>", {
                class: "tag_list"
            });
            $.each(bib.parsedEntries[id]['keywords'], function (i, tag) {
                var tagDiv = $("<div>", {
                    class: "tag",
                    text: tag, 
                    value: tag
                }).appendTo(tagListSpan);
                var colonIndex = tagDiv.text().indexOf(':');
                if (colonIndex >= 0 && tagListSpan.text().length - 1 > colonIndex) {
                    var tagCategory = tagDiv.text().substring(0, colonIndex + 1);
                    var tagCategorySpan = $('<span>', {
                        class: 'tag_category',
                        text: tagCategory
                    });
                    tagDiv.text(tagDiv.text().substring(colonIndex + 1));
                    tagDiv.prepend(tagCategorySpan);
                }
                tagDiv.click(function (event) {
                    selectors.toggleSelector('keywords', tag, event);
                });
            });
            return tagListSpan;
        }

        // based on: http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
        function sortDictKeysByValue(dict) {
            return Object.keys(dict).sort(function (a, b) {
                return dict[b] - dict[a]
            });
        }

        //http://stackoverflow.com/questions/2118560/jquery-form-submission-stopping-page-refresh-only-works-in-newest-browsers
        function stopEvent(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        var tagsDiv = $("<div>", {
            class: "tags"
        });
        var tagListSpan = createTagList(id);
        tagListSpan.appendTo(tagsDiv);
        if (editable) {
            var addTagForm = $('<form>', {
                text: '+',
                class: 'add_tag button tooltip',
                title: 'add tag'
            }).appendTo(tagsDiv);
            var addTagInput = null;
            addTagForm.click(function () {
                if (!addTagInput) {
                    addTagInput = $('<input>', {
                        class: 'tag_input'
                    }).appendTo(addTagForm);
                    addTagInput.autocomplete({  //自动填充
                        source: sortDictKeysByValue(bib.keywordFrequencies),
                        sortResults: false
                    });
                }
                addTagInput.show();
                addTagInput.focus();
            });
            addTagForm.submit(function (event) {
                stopEvent(event);
                var tagText = addTagInput.val();
                addTagInput.val('');
                var prevKeywords = bib.entries[id]['keywords'] ? bib.entries[id]['keywords'] + ', ' : '';
                bib.entries[id]['keywords'] = prevKeywords + tagText;
                bib.parsedEntries[id]['keywords'] = bibUtil.parseField(bib.entries[id]['keywords'], 'keywords', bib.tagCategories);
                $(this).parent('.tags').find('.tag_list').replaceWith(createTagList(id));
            });
        }
        return tagsDiv; 
    }

    function createComment(comment) {
        var commentDiv = $("<div>", {
            class: "comment",
            text: comment
        });
        $("<span>", {
            class: "label",
            text: "Comment: "
        }).prependTo(commentDiv);
        return commentDiv;
    }

    function createFooter(id, entry) {

        var footerContainerDiv = $('<div>', {
            class: 'footer_container'
        });

        var selectSimilarDiv = $('<div>', {
            class: 'button select_similar tooltip',
            text: 'select similar',
            title: 'add a selector for retrieving similar publications based on keywords, title, abstract, and authors'
        });
        selectSimilarDiv.click(function (event) {
            selectors.toggleSelector('entity', id, event)
        });

        footerContainerDiv.append(selectSimilarDiv);

        if (citations) {
            if (bib.references[id].referencesOutgoing) {
                var selectCitationsOutgoingDiv = $('<div>', {
                    class: 'button select_citations tooltip',
                    text: 'cited by this',
                    title: 'add a selector marking publications cited by this paper'
                });
                $('<span>', {
                    class: 'citation_outgoing_frequency'
                }).appendTo(selectCitationsOutgoingDiv);
                selectCitationsOutgoingDiv.click(function (event) {
                    selectors.toggleSelector('citations_outgoing', id, event)
                });
                footerContainerDiv.append(selectCitationsOutgoingDiv);
            }
            if (bib.references[id].referencesIncoming) {
                var selectCitationsIncomingDiv = $('<div>', {
                    class: 'button select_citations tooltip',
                    text: 'citing this', 
                    title: 'add a selector marking publications citing this paper'
                });
                $('<span>', {
                    class: 'citation_incoming_frequency'
                }).appendTo(selectCitationsIncomingDiv);
                selectCitationsIncomingDiv.click(function (event) {
                    selectors.toggleSelector('citations_incoming', id, event)
                });
                footerContainerDiv.append(selectCitationsIncomingDiv);
            }
        }
        createBibtexDiv(id, entry, footerContainerDiv);

        return footerContainerDiv;
    }

    function createImgDiv(id, pdfFile) {
        var entryImgDiv = $('<div>', {
            class: "entry_img"
        });
        var imgDiv;
        var img = dataDir + "papers_img/" + id + ".jpg";
        imgDiv = $("<img>", {
            class: "thumb",
            src: img
        });
        if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0) {
            imgDiv = imgDiv.appendTo($("<a>", {
                href: pdfFile,
                target: '_blank'
            }));
        }
        imgDiv.appendTo(entryImgDiv);
        return imgDiv;
    }

    function createBibtexDiv(id, entry, container) {
        var bibtexEditor = null;
        var bibtexControl = $("<div>", {
            class: "bibtex_control button tooltip",
            text: 'BibTeX ',
            title: 'show/hide BibTeX code'
        }).appendTo(container);
        var citationControl = $("<div>", {
            class: "citation_control button tooltip",
            text: 'Citation ',
            title: 'show/hide Citation'
        }).appendTo(container);
        if (bib.warnings[id] && bib.warnings[id].length > 0) {
            $('<span>&nbsp;(' + bib.warnings[id].length + '<span class="symbol">!</span>)</span>').appendTo(bibtexControl);
            var bibtexWarningsDiv = $('<div>', {
                class: 'bibtex_warnings'
            });
            bibtexWarningsDiv.hide();
            var bibtexWarningsLabel = $('<div>', {
                text: 'warnings:',
                class: 'label'
            }).appendTo(bibtexWarningsDiv);
            bibtexWarningsLabel.click(function (event) {
                selectors.toggleSelector('warning', '', event);
            });
            var bibtexWarningsUl = $('<ul>').appendTo(bibtexWarningsDiv);
            $.each(bib.warnings[id], function () {
                var warningText = this;
                if (warningText['type']) {
                    warningText = warningText['type'];
                }
                var bibtexWarningLi = $('<li>', {
                    text: warningText
                }).appendTo(bibtexWarningsUl);
                bibtexWarningLi.click(function (event) {
                    selectors.toggleSelector('warning', warningText, event);
                });
                if (this['fix']) {
                    var fix = this['fix'];
                    var bibtexWarningFixUl = $('<ul>').appendTo(bibtexWarningsUl);
                    var bibtexWarningFixLi = $('<li>', {
                        text: 'fix: ' + fix['description']
                    }).appendTo(bibtexWarningFixUl);
                    bibtexWarningFixLi.click(function () {
                        fix['function'](function (entry) {
                            bibtexEditor.setValue(bib.createBibtex(id, entry))
                        });
                        //bibtexEditor.setValue(bibtexText);
                    });
                }
            });
        }
        container.append(bibtexWarningsDiv);
        bibtexControl.click(function () {
            if (!bibtexEditor) {
                closeCitation(id);
                var bibtexText = bib.createBibtex(id, entry);
                bibtexEditor = CodeMirror(container.get(0), {
                    value: bibtexText,
                    lineWrapping: true,
                    readOnly: !editable
                });
            } else {
                closeBibtex(id, container);
            }
            bibtexEditor.focus();
            if (!editable) {
                bibtexEditor.setSelection({ line: 0, ch: 0 }, {
                    line: bibtexEditor.lastLine(),
                    ch: bibtexEditor.getLine(bibtexEditor.lastLine()).length
                });
            } else {
                var bibtexAddFieldForm = $('<form>', {
                    class: 'bibtex_add_field'
                }).appendTo(container);
                $('<span>', {
                    text: 'add field with value: '
                }).appendTo(bibtexAddFieldForm);
                var bibtexAddFieldTextInput = $('<input>', {
                    type: 'text'
                }).appendTo(bibtexAddFieldForm);
                bibtexAddFieldForm.submit(function (event) {
                    event.preventDefault();
                    var inputText = bibtexAddFieldTextInput.val();
                    var bibtexText = bibtexEditor.getValue();
                    var newBibtexText = addField(bibtexText, inputText)
                    bibtexEditor.setValue(newBibtexText);
                    bibtexAddFieldTextInput.val('');
                    updateEntryBasedOnBibtex(id, bibtexEditor);
                });
                $('<div>', {
                    class: 'bibtex_status'
                }).appendTo(container);
                bibtexEditor.on('change', function (bibtexEditor) {
                    updateEntryBasedOnBibtex(id, bibtexEditor);
                });
            }
            if (bib.warnings[id] && bib.warnings[id].length > 0) {
                bibtexWarningsDiv.toggle()
            }
        });
        citationControl.click(function () {
            if ($(bib.entryDivs[id]).find('.citation').length) {
                closeCitation(id);
            } else {
                if (bibtexEditor) {
                    closeBibtex(id, container);
                }
                var citation = bib.createCitation(id);
                var citationDiv = $('<div class="citation">' + citation + '</div>').appendTo(bib.entryDivs[id]);
                selectElementText(citationDiv.get(0));
            }
        });
    }

    function closeBibtex(id, container) {
        container.find('.CodeMirror').toggle();
        bib.entryDivs[id] = null;
        page.update();
    }

    function closeCitation(id) {
        $(bib.entryDivs[id]).find('.citation').remove();
    }

    function shortenText(s, length) {
        if (s.length > length * 1.5 && length > 3) {
            return s.substring(0, length - 3) + '...';
        }
        return s;
    }

    function addField(bibtexText, inputText) {
        var fieldType = '';
        inputText = inputText.trim();
        var inputTextLower = inputText.toLowerCase();
        //判断输入的类型
        if (inputTextLower.indexOf('10.') === 0) {
            fieldType = 'doi';
        } else if (inputTextLower.length > 200) {
            fieldType = 'abstract';
        } else if (inputTextLower.indexOf('http') === 0) {
            fieldType = 'url';
        } else if (inputTextLower.match(/\d\d\d\d-\d\d-\d\d/)) {
            fieldType = 'date';
        } else if (inputTextLower.match(/\d+ ?--? ?\d+/)) {
            fieldType = 'pages';
        } else if (inputTextLower.indexOf('proceedings of') >= 0 || inputTextLower.indexOf('international') >= 0) {
            fieldType = 'booktitle';
        } else {
            Object.keys(bib.entries).some(id => {
                if (bib.entries[id].series === inputText) {
                    fieldType = 'series';
                    return true;
                } else if (bib.entries[id].publisher === inputText) {
                    fieldType = 'publisher';
                    return true;
                }
                return false;
            })
            if (!fieldType && inputText.toUpperCase() === inputText) {
                fieldType = 'series';
            }
        }
        if (fieldType) {
            page.notify(`Automatically detected field type: "${fieldType}".`);
        } else {
            page.notify('Could not automatically detect field type. Added value with field type "unknown", please change manually.', 'error');
            fieldType = 'unknown';
        }
        var newFieldText = ',\n  ' + fieldType + ' = {' + inputText + '}';
        var posClosingBracket = bibtexText.lastIndexOf('}');
        if (bibtexText[posClosingBracket - 1] === '\n') {
            posClosingBracket--;
        }
        return [bibtexText.slice(0, posClosingBracket),
            newFieldText, bibtexText.slice(posClosingBracket)].join('');
    }
    function updateEntryBasedOnBibtex(id, bibtexEditor) {
        const bibtexStatusDiv = bib.entryDivs[id].find('.bibtex_status');
        bibtexStatusDiv.empty();
        try {
            var bibtexText = bibtexEditor.getValue();
            var bibtexEntries = bib.parse(bibtexText);
            $.each(bibtexEntries, function (parsedID) {
                var bibtexEntry = bibtexEntries[parsedID];
                if (id != parsedID) {
                    $('<div>', {
                        text: 'Changed ID of entry will only be applied after save and refresh.',
                        class: 'info'
                    }).appendTo(bibtexStatusDiv);
                }
                bib.entries[id] = {};
                for (var key in bibtexEntry) {
                    var keyLower = key.toLowerCase();
                    bib.entries[id][keyLower] = bibtexEntry[key];
                }
            });
        }
        catch (err) {
            $('<div>', {
                text: err,
                class: 'error'
            }).appendTo(bibtexStatusDiv);
        }
        bib.entryDivs[id].find('.entry_main').replaceWith(createEntryMainDiv(id));
        bib.warnings[id] = warnings.computeWarnings(bib.entries[id]);
    }
    
    // http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
    function selectElementText(el, win) {
        win = win || window;
        var doc = win.document, sel, range;
        if (win.getSelection && doc.createRange) {
            sel = win.getSelection();
            range = doc.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(el);
            range.select();
        }
    }
    
})();