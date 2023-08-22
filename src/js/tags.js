const tags = (function () {

    var tagIDCache = {};
    var tagarray = []

    return {

        /**
         * Updates all tag clouds
         */
        updateTagClouds: function () {
            bib.keywordFrequencies = {};
            $('#tag_clouds').find('.tags-container').empty();
            // 根据数据生成标签
            $.each(tagCloudOptions, function () {
                updateTagCloud(this);
            });
        }
    };

    //生成对应的标签
    function updateTagCloud(options) {
        
        parseEntries(options);
        // 生成一个类别的div
        var tagCloudID = 'tag_cloud_' + options.field;
        var tagCloudDiv = $('#' + tagCloudID);
        if (tagCloudDiv.length == 0) {

            tagCloudDiv = initTagCloudDiv(options);
        }
        // console.log("tagCloudDiv:",tagCloudDiv)
        // find()方法用于查找数组中符合条件的第一个元素，如果没有符合条件的元素，则返回undefined
        var containerDiv = tagCloudDiv.find('.tags-container');
        var tagFrequency = {};
        var tagFrequencySelector = {};
 
        $.each(bib.filteredEntries, function (id) {
            var parsedTags = bib.parsedEntries[id][options.field];
            $.each(parsedTags, function (j, tag) {
                var tagID = getTagID(tag, options.field);

                if (tagFrequency[tagID]) {
                    tagFrequency[tagID] += 1;
                } else {
                    tagFrequency[tagID] = 1;
                }
            });
        });

        $.each(bib.filteredEntries, function (id) {
            var parsedTags = bib.parsedEntries[id][options.field];
            $.each(parsedTags, function (j, tag) {
                var tagID = getTagID(tag, options.field);
                if (!tagFrequencySelector[tagID]) {
                    tagFrequencySelector[tagID] = [];
                }
                $.each(selectors.getSelectors(), function (i, selector) {
                    if (selector && !selector['lock']) {
                        if (!tagFrequencySelector[tagID][i]) {
                            tagFrequencySelector[tagID][i] = 0;
                        }
                        tagFrequencySelector[tagID][i] += bib.entrySelectorSimilarities[id][i] / tagFrequency[tagID];
                    }
                });
            });
        });
        var usedCategoryTags = [];

        // tagCategoriesData
        // 将context的内容单独处理
        if (options.field === 'context') {
            // console.log("bib.tagCategories:", bib.tagCategories)
            $.each(bib.tagCategories, function (categoryName, category) {

                var tagDivsCategory = [];

                $.each(tagFrequency, function (tagID, frequency) {

                    var tag = getTag(tagID, options.field);
                    // lastindexof()用于在数组中查找元素，可返回指定元素值在数组中最后出现的位置（下标值）
                    if (tag && tag.lastIndexOf((categoryName + ":"), 0) == 0) {
                        if (tag.indexOf('?') < 0) {
                            bib.keywordFrequencies[tag] = frequency;
                        }
                        var tagDiv = createTag(tag, options, frequency, tagFrequencySelector);
                        // console.log("tagFrequencySelector:",tagFrequencySelector)
                        if (tagDiv) {
                            tagDivsCategory.push(tagDiv);
                        }
                        usedCategoryTags.push(tagID);
                    }
                });
                // console.log("categoryName:",categoryName)
                appendTagDivs(categoryName, category['description'], tagDivsCategory, containerDiv);
            });
        }
        if (options.field === 'Data') {
            // console.log("bib.tagCategories:",bib.tagCategories)
            $.each(bib.tagCategoriesData, function (categoryName, category) {
                var tagDivsCategory = [];
                $.each(tagFrequency, function (tagID, frequency) {
                    var tag = getTag(tagID, options.field);
                    // lastindexof()用于在数组中查找元素，可返回指定元素值在数组中最后出现的位置（下标值）
                    if (tag.lastIndexOf((categoryName + ":"), 0) == 0) {
                        if (tag.indexOf('?') < 0) {
                            bib.keywordFrequencies[tag] = frequency;
                        }
                        var tagDiv = createTag(tag, options, frequency, tagFrequencySelector);
                        // console.log("tagFrequencySelector:",tagFrequencySelector)
                        if (tagDiv) {
                            tagDivsCategory.push(tagDiv);
                        }
                        usedCategoryTags.push(tagID);
                    }
                });
                // console.log("categoryName:",categoryName)
                appendTagDivs(categoryName, category['description'], tagDivsCategory, containerDiv);
            });
        }

        if (options.field === 'VisualForms') {
            $.each(bib.tagCategoriesVisualForms, function (categoryName, category) {
                var tagDivsCategory = [];
                $.each(tagFrequency, function (tagID, frequency) {
                    var tag = getTag(tagID, options.field);
                    // lastindexof()用于在数组中查找元素，可返回指定元素值在数组中最后出现的位置（下标值）
                    if (tag.lastIndexOf((categoryName + ":"), 0) == 0) {
                        if (tag.indexOf('?') < 0) {
                            bib.keywordFrequencies[tag] = frequency;
                        }
                        var tagDiv = createTag(tag, options, frequency, tagFrequencySelector);
                        // console.log("tagFrequencySelector:",tagFrequencySelector)
                        if (tagDiv) {
                            tagDivsCategory.push(tagDiv);
                        }
                        usedCategoryTags.push(tagID);
                    }
                });
                // console.log("categoryName:",categoryName)
                appendTagDivs(categoryName, category['description'], tagDivsCategory, containerDiv);
            });
        }

        var tagDivs = [];

        $.each(tagFrequency, function (tagID, frequency) {
            var tag = getTag(tagID, options.field);
            if (usedCategoryTags.indexOf(tagID) < 0) {
                if (options.field === 'context' || options.field === 'Data' || options.field === 'VisualForms') {
                    bib.keywordFrequencies[tagID] = frequency;
                }
                var tagDiv = createTag(tag, options, frequency, tagFrequencySelector);
                if (tagDiv) {
                    tagDivs.push(tagDiv);
                }
            }
        });
        // appendTagDivs(options.field === 'context' ? 'other' : '', 'unclassified tags', tagDivs, containerDiv);
        // appendTagDivs(options.field === 'Data' ? 'other' : '', 'unclassified tags', tagDivs, containerDiv);
        appendTagDivs(options.field === '1' ? 'other' : '', 'unclassified tags', tagDivs, containerDiv);
        filterTags(tagCloudDiv);

    }

    function parseEntries(options) {
        if (!bib.parsedEntries) {
            bib.parsedEntries = {};
        }
        $.each(bib.entries, function (id, entry) {
            // console.log("entry:",entry)
            if (!bib.parsedEntries[id]) {
                bib.parsedEntries[id] = {};
            }
            if (options.field === 'warning') {
                bib.parsedEntries[id][options.field] = [];
                if (bib.warnings[id]) {
                    $.each(bib.warnings[id], function (i, warning) {
                        var warningType = warning['type'] ? warning['type'] : warning;
                        bib.parsedEntries[id][options.field].push(warningType);
                    });
                }
            } else {
                bib.parsedEntries[id][options.field] = bibUtil.parseField(
                    entry[options.field], options.field, bib.tagCategories
                );
            }
        });
    }

    function createTag(tag, options, frequency, tagFrequencySelector) {
        var tagID = getTagID(tag, options.field);
        //console.log("options.minTagFrequency:",options.minTagFrequency)
        // console.log("option:",options)
        if (frequency < options.minTagFrequency) {
            return;
        }
        var frequencyClass = tagUtil.getFrequencyClass(frequency);
        // console.log("frequencyClass:",frequencyClass)
        var tagDiv = $('<div>', {
            class: 'tag ' + frequencyClass,
            value: frequency
        });
        // console.log(tag.indexOf(":"))
        // console.log("tag.substring(tag.indexOf(':'):",tag.substring(tag.indexOf(":")+1).split('/'))
        const tag_num = tag.substring(tag.indexOf(":") + 1).split('/')
        if (tag_num.length > 1) {
            for (let i in tag_num) {
                $('<span>', {
                    class: 'text',
                    html: tag_num[i]
                }).appendTo(tagDiv);
            }
        }
        else {
            $('<span>', {
                class: 'text',
                html: latexUtil.latexToHtml(tag.substring(tag.indexOf(":") + 1))
            }).appendTo(tagDiv);
        }
        // console.log("tag：",tag)
        // tag为文本内容
        // substring() 方法用于提取字符串中介于两个指定下标之间的字符。substring() 方法返回的子串包括 开始 处的字符，但不包括 结束 处的字符。
        // 传入关键字内容


        // 生成左侧条形图
        var sparklineDiv = $('<div>', {
            class: 'vis sparkline'
        }).prependTo(tagDiv);

        selectors.vis(sparklineDiv, tagFrequencySelector[tagID]);
        var activeTags = selectors.getActiveTags(options.field);
        if (activeTags[tagID]) {
            tagDiv.addClass("active");
            if (activeTags[tagID] === 'inverted') {
                tagDiv.addClass('inverted');
            }
        }
        
        // 每个关键字出现的次数
        $("<span>", {
            class: "tag_frequency",
            text: frequency
        }).appendTo(tagDiv);

        tagDiv.click(function (event) {
            selectors.toggleSelector(options.field, getTagID(tag, options.field), event);
        });
        if (bib.authorizedTags[tag] || options.field != 'context') {
            tagDiv.addClass('authorized');
        }
        tagDiv.mouseover(function () {
            if (!tagDiv.hasClass('tooltipstered')) {
                var tooltipDiv = $('<div>');
                $('<h3><span class="label">' + options.field + ': </span>' + latexUtil.latexToHtml(tag) + '</h3>').appendTo(tooltipDiv);
                $('<div><span class="label"># publications: </span>' + frequency + '</div>').appendTo(tooltipDiv);
                if (bib.authorizedTags[tag] || options.field != 'context') {
                    if (bib.authorizedTags[tag]) {
                        $('<div><span class="label">description: </span>' + bib.authorizedTags[tag]['description'] + '</div>').appendTo(tooltipDiv);
                    }
                }
                var totalSimilarity = selectors.computeTotalSimilarity(tagFrequencySelector[tag]);
                if (selectors.getNActiveSelectors() > 0) {
                    $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                    if (totalSimilarity > 0) {
                        var visDiv = $('<div>', {
                            class: 'vis'
                        }).appendTo(tooltipDiv);
                        selectors.vis(visDiv, tagFrequencySelector[tag]);
                    }
                }
                tagDiv.tooltipster({
                    content: $(tooltipDiv),
                    theme: 'tooltipster-survis'
                });
                tagDiv.tooltipster('show');
            }
        });
        return tagDiv;
    }

    function appendTagDivs(name, title, tagDivs, element) {
        // console.log("element",element)
        // console.log("name:",name)
        tagDivs = tagDivs.sort(function (a, b) {
            var nA = parseInt(a.attr('value'));
            var nB = parseInt(b.attr('value'));
            if (nA < nB)
                return 1;
            else if (nA > nB)
                return -1;
            else {
                // return 0;
                return a.children()[1].innerText.localeCompare(b.children()[1].innerText);
            }
        });
        // 二级标签 
        var categoryDiv = $('<div>', {
            class: 'tag_category'
        }).appendTo(element);
        if (name) {
            var labelDiv = $('<span>', {
                class: 'label tooltip',
                title: title,
                text: name + ": "
            }).appendTo(categoryDiv);
            labelDiv.tooltipster({
                theme: 'tooltipster-survis'
            });
        }
        $.each(tagDivs, function (i, tag) {
            tag.appendTo(categoryDiv);
        });
    }

    function initTagCloudDiv(options) {
        if (electron) {
            const incrementAtNPublications = [20, 50, 200, 1000];
            const n = Object.keys(bib.entries).length;
            let i = 0;
            while (incrementAtNPublications[i] <= n && i < incrementAtNPublications.length) {
                i++;
            }
            options.minTagFrequency = i + 1;
        }

        tagarray.push(options.field)
        // 获取 div 元素
        // var divElement = document.getElementById('tag_cloud_Visual Forms');
        // // console.log(divElement)
        // // 检查元素是否存在
        // if (divElement) {
        //     // 从父节点中移除该 div 元素
        //     divElement.parentNode.removeChild(divElement);
        // } else {
        //     // console.log('找不到指定的 div 元素！');
        // }
        // 根据数据类型生成对应的模块
        var id = 'tag_cloud_' + options.field;
        var tagCloudDiv = $(id);
        if (tagCloudDiv.length == 0) {
            tagCloudDiv = $('<div>', {
                class: 'tag_cloud',
                id: id
            });
            $('#tag_clouds').append(tagCloudDiv);
        }


        // empty()方法是将标签option中的值置成空就是将标签变成,remove方法则是将标签整个删除，意思就是将id为type的select标签从页面中删除
        tagCloudDiv.empty();


        // 加减框
        var tagOccurrenceDiv = $('<div>', {
            class: 'tag_occurrence toggle-container',
            text: 'min'
        }).appendTo(tagCloudDiv);
        var frequencySpan = $('<span>', {
            text: Math.max(1, options.minTagFrequency)
        });
        var buttonDec = $('<div>', {
            class: 'button dec small',
            text: '-'
        }).appendTo(tagOccurrenceDiv);
        buttonDec.click(function () {
            if (options.minTagFrequency > 1) {
                options.minTagFrequency--;
                frequencySpan.text(options.minTagFrequency);
                page.updateTags();
            }
        });
        if (options.minTagFrequency < 1) {
            options.minTagFrequency = 1
        }
        frequencySpan.appendTo(tagOccurrenceDiv);
        var buttonInc = $('<div>', {
            class: 'button inc small',
            text: '+'
        }).appendTo(tagOccurrenceDiv);
        buttonInc.click(function () {
            options.minTagFrequency++;
            frequencySpan.text(options.minTagFrequency);
            page.updateTags();
        });

        // 搜索框
        var tagCloudFilterForm = $('<form>', {
            class: 'tag_cloud_filter toggle-container'
        }).appendTo(tagCloudDiv);
        var tagCloudFilterInput = $('<input type="search" placeholder="filter ..."/>').appendTo(tagCloudFilterForm);

        tagCloudFilterInput.on('input', function () {
            filterTags(tagCloudDiv);
        });
        tagCloudFilterForm.submit(function () {
            return false;
        });

        console.log(options.title)
        
        if(options.title=="Data")
        {
            var h2Div = $('<h2><span class="symbol">/</span>' + "Data and Task Abstraction" + '</h2>').appendTo(tagCloudDiv);
        }
        else if(options.title=="Visual Forms")
        {
            var h2Div = $('<h2><span class="symbol">/</span>' + "Encoding and Interaction Design" + '</h2>').appendTo(tagCloudDiv);
        }
        else{
            var h2Div = $('<h2><span class="symbol">/</span>' + options.title + '</h2>').appendTo(tagCloudDiv);
        }
        
        h2Div.click(function () {
            uiUtil.toggleControl(h2Div);
        });

        // 标签内容展示
        tagCloudDiv.append($('<div>', {
            class: 'tags-container toggle-container'
        }));
        // console.log("tagCloudDiv:",tagCloudDiv)
        return tagCloudDiv;
    }

    function filterTags(tagCloudDiv) {
        var filterText = tagCloudDiv.find('.tag_cloud_filter input').val().toLowerCase();
        tagCloudDiv.find('.tag').each(function (i, tagDiv) {
            tagDiv = $(tagDiv);
            var textSpan = $(tagDiv).find('.text');
            if ($(textSpan).text().toLowerCase().indexOf(filterText) == -1) {
                tagDiv.hide();
            } else {
                tagDiv.show();
            }
        })
    }

    /**
     * Transforms a tag into an ID
     */
    function getTagID(tag, field) {
        if (field === 'context' || field === 'warning' || field === 'Data' || field === 'VisualForms' || field === "Vis_task") {
            return tag;
        }
        var tagID = tagUtil.simplifyTag(tag);
        tagIDCache[tagID] = tag;
        return tagID;
    }

    /**
     * Looks up the tag for a tag ID
     */
    function getTag(tagID, field) {
        if (field === 'context' || field === 'warning' || field === 'Data' || field === 'VisualForms' || field === "Vis_task") {
            return tagID;
        }
        return tagIDCache[tagID];
    }

})();



