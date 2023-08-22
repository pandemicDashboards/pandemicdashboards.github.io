const bib = (function () {

    var entries = readBibtex();
    if (!entries || Object.keys(entries).length === 0) {
        if (!electron) {
            entries = generatedBibEntries;
        } else {
            console.error('Could not load bibliography: unknown reason. Please check if file is UTF8 encoded.');
        }
    }

    return {
        entries: entries,
        availablePdf: electron ? [] : availablePdf,
        availableImg: electron ? [] : availableImg,
        stopwords: userDefinedStopwords,
        // tagCategories: electron ? generateTagCategoriesFromcontext(entries) : userDefinedTagCategories,
        tagCategories: generateTagCategoriesFromcontext(entries),
        tagCategoriesData: generateTagCategoriesFromdata(entries),
        tagCategoriesVisualForms:generateTagCategoriesFromVisualForms(entries),
        authorizedTags: userDefinedAuthorizedTags,
        entryDivs: {},
        warnings: warnings.computeAllWarnings(entries),
        nVisibleEntries: 300,
        // sortedIDs:10,
        downloadBibtex: function () {
                               // 文件流
            var blob = new Blob([this.createAllBibtex(true)]);
                               //将内容保存到这个文件中 references.bib（文件名）
            window.saveAs(blob, 'references.bib');
        },
        
        createBibtex: function (id, entry) {
            var bibtex = '@' + entry['type'] + '{' + id;
            for (var fieldName in entry) { 
                if (fieldName == 'type' || isFieldForbidden(fieldName)) {
                    continue;
                }
                if (entry.hasOwnProperty(fieldName)) {//hasOwnProperty 检测对象的固有属性是否存在
                    //存在就进行拼接 获得bibtex字符串
                    bibtex += ",\n  " + fieldName + " = {" + entry[fieldName] + "}";
                }
            }
            if (typeof mandatoryFields != 'undefined' && mandatoryFields) {
                //mandatoryFields（必选项）存在且不为undefined 
                for (var i in mandatoryFields[entry["type"]]) {
                    if (!entry.hasOwnProperty(mandatoryFields[entry["type"]][i])) {
                        //存在继续拼接
                        bibtex += ",\n  " + mandatoryFields[entry["type"]][i] + " = {}";
                    }
                }
            }
            return bibtex + "\n}";
        },

        createCitation: function (id) {
            //citation 引用
            var bib = this;
            var citation = '';
            if (bib.parsedEntries[id]['author']) {
                //作者存在
                $.each(bib.parsedEntries[id]['author'], function (i, author) {
                    var authorSplit = author.split(', ');
                    if (authorSplit.length == 2) {
                        author = authorSplit[0] + ', ' + authorSplit[1].replace(/[^a-z -]/gi, '').replace(/\B\w*/g, '.').replace(/([A-Z])($|([ -]))/g, '$1.$3');
                    }
                    if (i == bib.parsedEntries[id]['author'].length - 1 && i > 0) {
                        citation += 'and ';
                    }
                    citation += latexUtil.latexToHtml(author);
                    //使用latexToHtml 将latext文件转换为html 拼接进入citation中
                    if (bib.parsedEntries[id]['author'].length > 2 || i > 0) {
                        citation += ', ';
                    } else {
                        citation += ' ';
                    }
                });
            }
            var year = bib.entries[id]['year'];
            //获取年份 拼接
            if (year) {
                citation += year + '. ';
            }
            if (title = bib.entries[id]['title']) {
            //获取标题 拼接
                citation += latexUtil.latexToHtml(title) + '. ';
            }
            var journal = bib.entries[id]['journal'];
            //获取期刊
            var pages = bib.entries[id]['pages'];
            //获取页码
            if (journal) {
                citation += 'In <i>' + latexUtil.latexToHtml(journal) + '</i>';
                var volume = bib.entries[id]['volume'];
                //获取卷
                if (volume) {
                    citation += ' (Vol. ' + latexUtil.latexToHtml(volume);
                    var number = bib.entries[id]['number'];
                    //获取数量
                    if (number) {
                        citation += ', No. ' + latexUtil.latexToHtml(number);
                    }
                    if (pages) {
                        citation += ', pp. ' + latexUtil.latexToHtml(pages);
                    }
                    citation += ')';
                }
                citation += '. ';
            }
            var booktitle = bib.entries[id]['booktitle'];
            if (booktitle) {
                citation += 'In <i>' + latexUtil.latexToHtml(booktitle) + '</i>';
                if (pages) {
                    citation += ' (pp. ' + latexUtil.latexToHtml(pages) + ')';
                }
                citation += '. ';
            }
            var doi = bib.entries[id]['doi'];
            var url = bib.entries[id]['url'];
            if (doi) {
                citation += 'DOI: <a href="http://dx.doi.org/' + doi + '">' + doi + '</a>. ';
            } else if (url) {
                citation += 'URL: <a href="' + url + '">' + url + '</a>. ';
            }
            return citation.trim();
            //trim() 删除字符串头尾的空白字符
        },

        createAllBibtex: function (filtered) {
            var bib = this;
            var bibtexString = '';
            const selectedEntries = filtered ? bib.filteredEntries : bib.entries;
            //filtered是否过滤 是就返回filteredEntries(过滤后的词条) 不过滤就返回entries（不过滤的词条）
            $.each(selectedEntries, function (id, entry) {  
                //选中的词条遍历
                //现置空
                var currentBibtex = "";
                if (bib.entryDivs[id]) {
                    bib.entryDivs[id].find(".CodeMirror-code").children().each(function () {
                        currentBibtex += $(this).text() + "\n";//获取找到这一类div的孩子 遍历获取其内容
                    });
                }
                if (!currentBibtex) {//获取内容不为空就创建createBibtex 
                    currentBibtex = bib.createBibtex(id, entry);
                }
                bibtexString += currentBibtex;//最后将创建的currentString 存入bibtexString
                bibtexString += "\n\n";//存入两个换行符
            });
            return bibtexString;
        },

        saveBibToFile: function () {
            //electron 桌面程序框架 
            //貌似是什么发请求 没太看懂
            require('electron').remote.getGlobal('sharedObject').bibData = this.createAllBibtex(false);
            const ipc = require('electron').ipcRenderer;
            ipc.send('saveFile');
            page.notify('File saved.');
        },

        saveBibToLocalStorage: function () {
            if (editable) {
                localStorage.bibtexString = this.createAllBibtex(false);
            }
        },

        addEntries: function () {
            var bib = this;
            var addEntriesDiv = $('<div>', {
                id: 'add_entries',
                title: 'Add entries',
                text: 'Paste one or more BibTeX entries:'
            }).appendTo($('body'));
                             //网络段代码编辑器
                             //在addEntriesDiv中添加网络代码编辑器
            var bibtexEditor = CodeMirror(addEntriesDiv.get(0), {
                lineWrapping: true
                //在长行时文字是换行(wrap)还是滚动(scroll)，默认为滚动(scroll) 
            });
            var bibtexStatusDiv = $('<div>', {
                class: 'bibtex_status'
            }).appendTo(addEntriesDiv);
            
            bibtexEditor.on('change', function (bibtexEditor) {
                bibtexStatusDiv.empty();
                var addButton = $('.add_entry_button');
                var addButtonTextDiv = addButton.find('.ui-button-text');
                try {
                    var bibtexText = bibtexEditor.getValue();
                    var bibtexEntries = bib.parse(bibtexText);
                    // console.log()
                    console.log("bibtexEntries:",bibtexEntries)
                    // var nEntries = Object.keys(bibtexEntries).length;
                    console.log(nEntries)
                    
                    if (nEntries > 0) {
                        addButtonTextDiv.text(
                            'add (' + nEntries + (nEntries > 1 ? ' entries)' : ' entry)')
                        );
                        addButton.button('enable');
                    } else {
                        addButtonTextDiv.text('add');
                        addButton.button('disable');
                    }
                }
                catch (err) {
                    $('<div>', {
                        text: err,
                        class: 'error'
                    }).appendTo(bibtexStatusDiv);
                    addButton.button('disable');
                }
            });
            addEntriesDiv.dialog({
                minWidth: 832,
                modal: true,
                buttons: {
                    'Add': {
                        text: 'add',
                        class: 'add_entry_button',
                        disabled: true,
                        click: function () {
                            var bibtexText = bibtexEditor.getValue();
                            addEntriesDiv.dialog('close');
                            if (bibtexText != null) {
                                var bibtexEntries = bib.parse(bibtexText);
                                for (var entryKey in bibtexEntries) {
                                    var bibtexEntry = bibtexEntries[entryKey];
                                    if (bib.entries[entryKey]) {
                                        page.notify('Entry with ID "' + entryKey + '" already exists and cannot be added to the database.');
                                    } else {
                                        bib.entries[entryKey] = {};
                                        for (var key in bibtexEntry) {
                                            var keyLower = key.toLowerCase();
                                            bib.entries[entryKey][keyLower] = bibtexEntry[key];
                                        }
                                        var mandatoryFields = ['author', 'year', 'title'];
                                        $.each(mandatoryFields, function (i, field) {
                                            if (!bib.entries[entryKey][field]) {
                                                bib.entries[entryKey][field] = '';
                                            }
                                        });
                                        bib.warnings[entryKey] = warnings.computeWarnings(bib.entries[entryKey]);
                                    }
                                }
                            }
                            if (Object.keys(bibtexEntries).length == 1) {
                                selectors.toggleSelector('search', Object.keys(bibtexEntries)[0]);
                            }
                            update();
                        }
                    },
                    cancel: function () {
                        $(this).dialog("close");
                    }
                }
            });
            bibtexEditor.focus();
        },

        parse: function (bibtexText) {
            var bibParser = new BibtexParser();
            bibParser.setInput(bibtexText);
            bibParser.bibtex();
            return bibParser.getEntries();
        },

        renameKeyword: function () {
            var bib = this;
            const renameDiv = $('<div>', {
                id: 'rename',
                title: "Rename keyword"
            });
            $(`<div>Please enter the keyword that should be renamed, followed by "->" and one or 
                    more comma-separated new names of the keyword.'</div>`)
                .appendTo(renameDiv);
            const renameForm = $(` 
                        <form id="rename_form">
                            <input type="text" id="rename_query" value="keyword_old->keyword_new, keyword_new2">
                            <input type="submit" value="rename">
                        </form>`)
                .appendTo(renameDiv);
            renameForm.submit(function (event) {
                event.preventDefault();
                const renameQuery = $('#rename_query').val();
                console.log(renameQuery);
                if (renameQuery.indexOf("->") < 0) {
                    page.notify('Wrong format of rename query: please use "->" ' +
                        'to separate the old from the new name of the keyword.', 'error');
                    return;
                }
                var context = $.map(renameQuery.split('->'), $.trim);
                if (!context[0]) {
                    page.notify('Wrong format of rename query: please specify the keyword you want to rename.', 'error');
                    return;
                }
                if (!context[1]) {
                    page.notify('Wrong format of rename query: please specify the new name of the keyword.', 'error');
                    return;
                }
                var newcontext = $.map(context[1].split(','), $.trim);
                console.log("context[1]",context[1])
                console.log("newcontext",newcontext)
                var renameCount = 0;
                $.each(bib.filteredEntries, function (id, entry) {
                    var keywordPos = $.inArray(context[0], bib.parsedEntries[id]['context']);
                    if (keywordPos >= 0) {
                        renameCount++;
                        var keywordList = [].concat(newcontext);
                        var keywordListParsed = [].concat(newcontext);
                        $.each(bib.parsedEntries[id]['context'], function (i, keyword) {
                            if (!(keyword === context[0]) && $.inArray(keyword, newcontext) < 0) {
                                keywordListParsed.push(keyword);
                                if (keyword.indexOf('?') < 0) {
                                    keywordList.push(keyword);
                                }
                            }
                        });
                        bib.entries[id]['context'] = keywordList.join(', ');
                        bib.parsedEntries[id]['context'] = keywordListParsed;
                    }
                });
                page.update(false);
                page.notify('Renamed context of ' + renameCount + ' entries. ');
            });
            renameDiv.dialog({
                minWidth: 832,
                modal: true
            });
        }
    };

    function readBibtex() {
        var bibParser = new BibtexParser();
        if (electron) {
            try {
                bibParser.setInput(require('electron').remote.getGlobal('sharedObject').bibData);
                bibParser.bibtex();
                return bibParser.getEntries();
            } catch (err) {
                console.error(err);
                alert('Could not load bibliography: \n\n' + err);
            }
            return null;
        } else {
            var loadFromLocalStorage = browserUtil.getUrlParameter('loadFromLocalStorage') === 'true';
            if (editable && loadFromLocalStorage && localStorage.bibtexString) {
                try {
                    bibParser.setInput(localStorage.bibtexString);
                    bibParser.bibtex();
                    return bibParser.getEntries();
                } catch (err) {
                    console.error(err);
                    console.log(localStorage.bibtexString);
                    alert('Could not load bibliography from local storage, loaded default instead (see console for details and locally stored bibliography): \n\n' + err.substring(0, 200));
                }
                return null;
            }
        }
    }

    // context 数据解析
    function generateTagCategoriesFromcontext(entries) {
        
        const tagCategories = {};
        Object.keys(entries).forEach(id => {
            // forEach()法对数组的每个元素执行一次提供的函数
            bibUtil.parseField(entries[id].context, 'context', tagCategories).forEach(keyword1 => {
                if (keyword1.indexOf(':') > 0) {
                    const category = keyword1.split(':')[0];
                    if (!tagCategories[category]) {
                        tagCategories[category] = {};
                    }
                }
            });
        });
        return tagCategories;
    }

    // Data 数据解析
    function generateTagCategoriesFromdata(entries) {
        // console.log("entries:",entries)
        const tagCategories1 = {};
        Object.keys(entries).forEach(id => {
            // forEach()法对数组的每个元素执行一次提供的函数
            // console.log("entries[id]:",entries[id])
            bibUtil.parseField(entries[id].Data, 'Data', tagCategories1).forEach(keyword1 => {
                if (keyword1.indexOf(':') > 0) {
                    const category = keyword1.split(':')[0];
                    if (!tagCategories1[category]) {
                        tagCategories1[category] = {};
                    }
                }
            });
        });
        return tagCategories1;
    }

    //VisualForms  数据解析
    function generateTagCategoriesFromVisualForms(entries) {
        // console.log("entries:",entries)
        const tagCategories2 = {};
        Object.keys(entries).forEach(id => {
            // forEach()法对数组的每个元素执行一次提供的函数
            // console.log("entries[id]:",entries[id])
            bibUtil.parseField(entries[id]['VisualForms'], 'VisualForms', tagCategories2).forEach(keyword1 => {
                if (keyword1.indexOf(':') > 0) {
                    const category = keyword1.split(':')[0];
                    if (!tagCategories2[category]) {
                        tagCategories2[category] = {};
                    }
                }
            });
        });
        return tagCategories2;
    }

    function isFieldForbidden(fieldName) {
        const forbiddenFields = []; //['referencedby', 'titlesafe', 'references'];
        if (typeof forbiddenFields === 'undefined' || !forbiddenFields) {
            return false;
        }
        for (var i in forbiddenFields) {
            if (fieldName.indexOf(forbiddenFields[i]) == 0) {
                return true;
            }
        }
        return false;
    }

})();
