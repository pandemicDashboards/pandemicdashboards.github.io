const references = (function() {

    var minSimilarity = 0.8;
    var minReferenceLength = 20;
    var fields = ['author', 'title', 'booktitle', 'publisher', 'pages', 'year', 'doi', 'location', 'address', 'editors', 'series', 'journal', 'institution', 'volume', 'number'];

    var tokenEntryCache = {};

    return {

        readReferences: function () {
            var referenceLists = bib.referenceLists;
            console.log(referenceLists);
            $.each(referenceLists, function (id, references) {
                $.each(references, function (i, reference) {
                    if (reference.length > minReferenceLength) {
                        //reference长度比最小的reference要长
                        //reference --> tokenizedReferences -->  similarity 
                        var tokenizedReferences = tokenizeSearchString(reference);
                        var max = 0; 
                        var maxId = '';
                        var candidateCount = 0;
                        $.each(bib.entries, function (id2, entry) {
                            if (id2 != id) {
                                var similarity = computeSearchSimilarity(id2, entry, tokenizedReferences);
                                if (similarity > minSimilarity) {
                                    candidateCount++;
                                }
                                if (similarity > max) {
                                    max = similarity;
                                    //max存最大的相似
                                    maxId = id2;
                                    //maxId 存最大的下标
                                }
                            }
                        });
                        if (max > minSimilarity && candidateCount == 1) {
                            if (!bib.entries[id].references) {
                                //置空
                                bib.entries[id].references = '';
                            }
                            if (bib.entries[id].references.split(' ').indexOf(maxId) == -1) {
                                //没有最大下标 拼接起来
                                bib.entries[id].references += ' ' + maxId;
                                //将内容清洗一下子 去掉头尾的空格等
                                bib.entries[id].references = bib.entries[id].references.trim();
                                console.log(id + ': ' + maxId + ' ' + max + ' ' + reference);
                            }
                        }
                    }
                });
            });
        },

        updateReferences: function () {
            if (!citations) {
                //citations 为空直接返回
                return;
            }
            bib.references = {};

            $.each(bib.entries, function (id, entry) {
                var referencesOutgoing = parseReferences(entry['references']);
                referencesOutgoing = (referencesOutgoing ? referencesOutgoing.filter(onlyUnique) : null);
                if (!bib.references[id]) {
                    //references[id]为空 给对应id的置空
                    bib.references[id] = {};
                }
                bib.references[id].referencesOutgoing = referencesOutgoing;
                if (referencesOutgoing) {
                    $.each(referencesOutgoing, function (i, id2) {
                        if (!bib.references[id2]) {
                            bib.references[id2] = {};
                        }
                        if (!bib.references[id2].referencesIncoming) {
                            bib.references[id2].referencesIncoming = [];
                        }
                        //为空先置空 将id push进入
                        bib.references[id2].referencesIncoming.push(id);
                    });
                }
            });
            bib.filteredReferences = {};
            $.each(bib.filteredEntries, function (id, entry) {
                bib.filteredReferences[id] = {};
                if (bib.references[id].referencesOutgoing) {
                    //bib.references[id].referencesOutgoing不为空 
                    //将bib.filteredReferences[id].referencesOutgoing置空
                    bib.filteredReferences[id].referencesOutgoing = [];
                    //
                    $.each(bib.references[id].referencesOutgoing, function (i, id2) {
                        var passedFilter = Object.keys(bib.filteredEntries).indexOf(id2) >= 0;
                        if (passedFilter) {
                            bib.filteredReferences[id].referencesOutgoing.push(id2);
                        }
                    });
                }
                if (bib.references[id].referencesIncoming) {
                    bib.filteredReferences[id].referencesIncoming = [];
                    $.each(bib.references[id].referencesIncoming, function (i, id2) {
                        var passedFilter = Object.keys(bib.filteredEntries).indexOf(id2) >= 0;
                        if (passedFilter) {
                            bib.filteredReferences[id].referencesIncoming.push(id2);
                        }
                    });
                }
            });
        }
    };

    // 计算搜索的相似度？？
    function computeSearchSimilarity(id, entry, tokens) {
        if (!tokenEntryCache[id]) {
            tokenEntryCache[id] = {};
        }
        var matchCount = 0;
        $.each(tokens, function (i, token) {
            var containedInValues = false;
            if (tokenEntryCache[id][token] != undefined) {
                containedInValues = tokenEntryCache[id][token];
            } else {
                $.each(fields, function (j, field) {
                    if (entry[field]) {
                        if (entry[field].toLowerCase().indexOf(token) >= 0) {
                            containedInValues = true;
                        }
                    }
                });
                containedInValues = id.toLowerCase().indexOf(token) >= 0 || containedInValues;
                tokenEntryCache[id][token] = containedInValues;
            }
            matchCount += containedInValues ? 1 : 0;
        });
        return matchCount / tokens.length;
    }
    /// 令牌解析？？？
    function tokenizeSearchString(text) {
        text = text.toLowerCase();
        var re = /\W+/;   
        var words = text.split(re);
        //$.grep() 函数使用指定的函数 过滤数组 中的元素，并返回过滤后的数组。
        words = $.grep(words, function (word) {
            //$.inArray() 函数用于在数组中查找指定值，并返回它的索引值（如果没有找到，则返回-1）
            return word.length > 1 && !($.inArray(word, bib.stopwords) >= 0);
                 //词的长度是否大于1 此种是否含有停止的词汇
        });
        return words;
    }
    // 解析reference ？？
    function parseReferences(refString) {
        if (!refString) {
            return null;//refString为空返回空
        }
        return refString.split(' ');//否则 返回用空格分割的数组
    }
    //查询？？
    function onlyUnique(value, index, self) {

        return self.indexOf(value) === index;
    }

})();