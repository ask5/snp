(function () {
    var modules = [
            "jquery",
            "modernizer-2.0.6.min",
            "jquery.ajaxmanager",
            "jquery.ba-bbq.min",
            "jquery.endless-scroll",
            "jquery.masonry.min",
            "dotimeout",
            "mustache"];

    require(modules, function ($) {

        Date.prototype.formatMMDDYYYY = function () {
            return this.getMonth() + "/" + this.getDate() + "/" + this.getFullYear();
        }

        var Contexts = {
            News: "news",
            Article: "article"
        };

        var Current = {
            Context: null,
            Scroll: null,
            Page: null,
            ArticleID: null,
            League: null,
            Stream: { headlines: [] },
            ResultCount: 0

        };

        var Templates = {

            SportsList: "<ul id='sports'>{{#Sports}}<li><span name='{{name}}'>{{displayname}}</span></li>{{/Sports}}</ul>",

            Headlines: "{{#headlines}}<li class='item' headlineid='{{id}}' url='{{apiurl}}'><div class='box'><h3><a href='{{weburl}}' target='_blank'>{{headline}}</a></h3>" +
                   "<div class='date'>{{published}}</div><div class='source'>{{source}}</div>" +
                   "<div class='image'><img src='{{images.0.url}}' alt='{{images.0.alt}}' /><div class='credit'>credit: {{images.0.credit}}</div><div class='caption'>{{images.0.caption}}</div></div>" +
                   "<div class='desc'>{{description}}</div>" +
                   "<div class='image'><img src='{{images.1.url}}' alt='{{images.1.alt}}' /><div class='credit'>credit: {{images.1.credit}}</div><div class='caption'>{{images.1.caption}}</div></div>" +
                   "<div class='image'><img src='{{images.2.url}}' alt='{{images.2.alt}}' /><div class='credit'>credit: {{images.2.credit}}</div><div class='caption'>{{images.2.caption}}</div></div>" +
                   "</div>" +
                   "<div class='related-articles'><h3>Related Articles</h3><ul class='related'>{{#related}}<li><a href='{{links.web.href}}' target='_blank'>{{title}}</a></li>{{/related}}</ul></div>" +
                    "<div class='toolbar'><div class='bookmark {{bookmark}}' state='{{bookmark}}' articleid='{{id}}' title='{{bookmarktitle}}' /></div>" +
                   "</li>{{/headlines}}",

            Article: "{{#headlines}}<img alt='close' class='closeArticle' src='img/fancy_close.png' /><div class='box' id='{{id}}' url='{{apiurl}}'>" +
            //"<div class='articleNav'><span class='prevart' articleid='{{prevID}}'><< {{prevText}}</span> <span class='nextart' articleid='{{nextID}}'> >>{{nextText}} </span></div>" +
                   "<h2>{{headline}}</h2><span class='date'>{{published}},</span><span class='source'>{{source}}</span>" +
                   "<div class='desc'>{{description}}</div>" +
                   "<div class='imgwidget'>" +
                   "<ul class='list'>{{#images}}<li>" +
                   "<img class='thumbnail' src='{{url}}' alt='{{alt}}' /><img class='hidden_image' src='{{url}}' height='{{height}}' width='{{width}}' alt='{{alt}}' style='display:none;'/><span class='hidden_caption' style='display:none;'>{{caption}}</span><span class='hidden_credit' style='display:none;'>Credit: {{credit}}</span>" +
                   "</li>{{/images}}</ul>" +
                   "<div class='view'><div class='caption' /><div class='img' /><div class='credit' /></div>" +
                   "</div>" +
                   "<ul class='categories'>{{#categories}}<li>{{description}}</li>{{/categories}}</ul>" +
                   "<div class='Articlelink'><a href='{{weburl}}' target='_blank'>Go to original article</a></div>" +
                   "<div class='related-articles'><h3>Related Articles</h3><ul class='related'>{{#related}}<li id='{{id}}'>{{title}}</li>{{/related}}</ul></div>" +
                   "<div class='adbanner'></div><div class='clearfix'></div>" +
                   "</div>{{/headlines}}",

            Leagues: "{{#leagues}}<li><span name='{{abbreviation}}' title='{{name}}'>{{abbreviation}}</span></li>{{/leagues}}"
        };

        var Ui = {
            busy: function () { $(".loading").show(); },

            ready: function () { $(".loading").hide(); },

            createSportsList: function (data) {
                var html = Mustache.to_html(Templates.SportsList, data);
                $("#nav").html(html);
            },

            showArticle: function (data) {
                Current.Context = Contexts.Article;
                Ui.screenSetup();
                var html = Mustache.to_html(Templates.Article, data);
                $("#article").html(html);
                var descontainer = $("#article .adbanner");
                descontainer.append($('#adspanel .boxad').clone().show());
                descontainer.append("<div class='clearfix'></div>");
                window.scrollTo(0, 0);

                if (data.headlines[0].images.length > 0) {
                    $(".imgwidget").show();
                    var img = $("<img />").attr("src", data.headlines[0].images[0].url);
                    $(".imgwidget .view .img").html(img);
                    $(".imgwidget .view .caption").text(data.headlines[0].images[0].caption);
                    $(".imgwidget .view .credit").text(data.headlines[0].images[0].credit);
                    if (data.headlines[0].images.length == 1)
                        $(".imgwidget .list").hide();
                    else
                        $(".imgwidget .list").show();
                } else {
                    $(".imgwidget").hide();
                }
            },

            showHeadlines: function (data) {
                Current.Context = Contexts.News;
                Ui.screenSetup();
                var html = Mustache.to_html(Templates.Headlines, data);
                $("#headlines").append(html);
                ESPN.AdCnt++;
                if (ESPN.AdCnt == 1) {
                    var item = $("<li class='item ad' />");
                    item.append($("#adspanel .towerad").clone());
                    item.appendTo('#headlines');

                }
                if (ESPN.AdCnt > ESPN.MaxAdCnt)
                    ESPN.AdCnt = 0;

                $("#headlines li img[alt='']").parent().remove();
                Ui.masonry();


            },

            showLeagues: function (data) {
                var html = Mustache.to_html(Templates.Leagues, data);
                $("#leagues").html(html);
                Ui.highlightMenu();
            },

            screenSetup: function () {
                switch (Current.Context) {
                    case Contexts.News:
                        $("#headlines").show();
                        $("#article").hide();
                        break;
                    case Contexts.Article:
                        $("#headlines").hide();
                        $("#article").show();
                        break;
                }
            },

            reset: function () {
                $("#msg").empty();
                $("#headlines li").remove();
            },

            highlightMenu: function () {
                $("#sports li a").each(function () {
                    if ($(this).attr("name") == Current.Page) {
                        $(this).addClass("select");
                    } else {
                        $(this).removeClass("select");
                    }
                });

                $("#leagues li span").each(function () {
                    if ($(this).attr("name") == Current.League) {
                        $(this).addClass("select");
                    } else {
                        $(this).removeClass("select");
                    }
                });
            },

            emptyMsg: function () {
                if ($("#headlines li").length <= 0) {
                    $("#headlines").height(0);
                    $("#msg").empty().text("No news found for this section, scroll down for older news.");
                    $("#msg").append($('#adspanel .boxad').clone().css("margin-top", '2em'));
                } else {
                    $("#msg").empty();
                }
            },

            masonry: function () {
                var $container = $('#headlines');
                $container.imagesLoaded(function () {
                    $container.masonry({
                        itemSelector: '.item'
                    });
                });
                $container.masonry('reload');
            }
        };


        var ESPN = {
            NDate: 0,
            Date: null,
            Days: 0,
            CFail: 0,
            Offset: 1,
            AdCnt: 0,
            MaxAdCnt: 2,
            Ajax: null,
            Lag: 1000,
            SportsAPIKey: "eqe7na27uxftyx8qnj6f3uwz",
            AlertsAPIKey: "888bvpezh76x4ntfag4z5ehf",
            Mime: "application/json",
            SportsAPI: "http://api.espn.com/v1/sports",
            CacheSportsAPI: "cache/sports.json",
            LeaguesAPI: "http://api.espn.com/v1/sports/{{sport}}/leagues",
            ArticleAPI: "http://api.espn.com/v1/sports/news/",
            LeagueAPI: "http://api.espn.com/v1/sports/",
            Sports: [],
            CurrentSportName: "",
            NewsContextAPI: null,
            NewsContextHeading: null,
            Bookmarks: "snpbookmarks",


            GetSportsList: function () {
                ESPN.Ajax.add({
                    url: ESPN.SportsAPI,
                    data: {
                        apikey: ESPN.SportsAPIKey,
                        _accept: ESPN.Mime
                    },
                    beforeSend: Ui.busy(),
                    dataType: 'jsonp',
                    success: function (data) {
                        if (data.status != 'error')
                            ESPN.LoadSportsList(data);
                        else
                            ESPN.GetCachedSportsList();
                    },
                    complete: function () {
                        Ui.ready();
                    },
                    error: function () {
                        ESPN.GetCachedSportsList();
                    }
                });
            },

            GetCachedSportsList: function () {
                ESPN.Ajax.add({
                    url: ESPN.CacheSportsAPI,
                    beforeSend: Ui.busy(),
                    dataType: 'json',
                    success: function (data) {
                        ESPN.LoadSportsList(data);
                    },
                    complete: function () {
                        Ui.ready();
                    }
                });
            },

            LoadSportsList: function (data) {
                $.each(data.sports, function () {
                    ESPN.Sports.push({ id: this.id, name: this.name, displayname: this.name, sportsurl: this.links.api.sports.href, newsurl: this.links.api.news.href,
                        notesurl: this.links.api.notes.href, headlinesurl: this.links.api.headlines.href, eventsurl: this.links.api.events.href, leagues: this.leagues
                    });
                });

                if (Modernizr.localstorage) {
                    ESPN.Sports.push({
                        id: "bookmarks",
                        name: "bookmarks",
                        displayname: "My Bookmarks"
                    });
                }

                //Ui.createSportsList(ESPN);
            },

            GetLeaguesList: function (sport) {
                $.each(ESPN.Sports, function () {
                    var s = $(this)[0];
                    if (s.name == sport) {
                        if (s.leagues != undefined)
                            Ui.showLeagues(s);
                    }
                });
            },

            GetNews: function () {
                if (ESPN.NewsContextAPI != null) {
                    ESPN.Ajax.add({
                        url: ESPN.NewsContextAPI + "/dates/" + ESPN.NDate,
                        data: {
                            apikey: ESPN.SportsAPIKey,
                            _accept: ESPN.Mime,
                            offset: ESPN.Offset
                        },
                        dataType: 'jsonp',
                        beforeSend: function () {
                            Ui.busy();
                        },
                        complete: function () {
                            Ui.emptyMsg();
                            $("#headlines").masonry('reload');
                            Ui.ready();
                        },
                        success: function (data) {
                            if (data.status != 'error') {
                                var items = { Stream: { headlines: []} };

                                Current.ResultCount = data.resultsCount;
                                var bookmarks;
                                var raw = ESPN.GetBookmarksRaw();
                                if (raw != null)
                                    bookmarks = JSON.parse(raw);

                                if (data.headlines.length > 0) {
                                    $.each(data.headlines, function () {
                                        if (this.headline != undefined && this.headline != '') {
                                            var i = [];
                                            $.each(this.images, function () {
                                                i[this.alt] = this;
                                            });
                                            var images = [];
                                            for (k in i) images.push(i[k]);

                                            var d = new Date(this.published);
                                            var bm = "";
                                            var bt = "bookmark";
                                            var currentId = this.id;
                                            if (bookmarks != undefined) {
                                                if (bookmarks.Stream.headlines != undefined) {
                                                    $.each(bookmarks.Stream.headlines, function (i, v) {
                                                        if (v.id == currentId) {
                                                            bm = "bookmarked";
                                                            bt = "remove bookmark";
                                                        }
                                                    });
                                                }
                                            }

                                            var d = { id: this.id, apiurl: this.links.api.news.href, weburl: this.links.web.href,
                                                headline: this.headline, published: d.toDateString() + " " + d.toLocaleTimeString(),
                                                source: this.source, description: this.description, images: images, related: this.related, bookmark: bm, bookmarktitle: bt
                                            };

                                            items.Stream.headlines.push(d);
                                            Current.Stream.headlines.push(d);
                                        }
                                    });
                                    Ui.showHeadlines(items.Stream);
                                }
                            }
                        }
                    });
                }
            },

            GetArticle: function (id) {

                ESPN.Ajax.add({
                    url: ESPN.ArticleAPI + id,
                    data: {
                        apikey: ESPN.SportsAPIKey,
                        _accept: ESPN.Mime
                    },
                    dataType: 'jsonp',
                    success: function (data) {
                        var nextID;
                        var nextText;
                        var prevID;
                        var prevText;
                        $.each(Current.Stream.headlines, function (i, v) {
                            if (v.id == id) {
                                if (i < Current.Stream.headlines.length - 1) {
                                    nextID = Current.Stream.headlines[i + 1].id;
                                    nextText = Current.Stream.headlines[i + 1].headline;
                                }
                                if (i > 0) {
                                    prevID = Current.Stream.headlines[i - 1].id;
                                    prevText = Current.Stream.headlines[i - 1].headline;
                                }
                            }
                        });
                        var article = { headlines: [] };
                        if (data.headlines.length > 0) {
                            $.each(data.headlines, function () {
                                var i = [];
                                $.each(this.images, function () {
                                    i[this.alt] = this;
                                });
                                var images = [];
                                for (k in i) images.push(i[k]);

                                var parts = this.published.match(/(\d+)/g);
                                var d = new Date(this.published);

                                article.headlines.push({ id: this.id, apiurl: this.links.api.news.href, weburl: this.links.web.href,
                                    headline: this.headline, published: d.toDateString() + " " + d.toLocaleTimeString(),
                                    source: this.source, description: this.description, images: images, related: this.related,
                                    prevId: prevID, prevText: prevText, nextID: nextID, nextText: nextText
                                });
                            });
                        }
                        Ui.showArticle(article);
                    },
                    complete: function () {
                        Ui.ready();
                    }
                });
            },

            Reset: function () {
                ESPN.Date = new Date();
                ESPN.NDate = ESPN.GetNumericDate(ESPN.Date);
                ESPN.Days = 0;
                ESPN.CFail = 0;
                ESPN.Offset = 1;
                ESPN.AdCnt = 0;
                Ui.reset();
            },

            Init: function () {
                $("#adspanel").hide();
                //$("#main").hide();

                ESPN.Sports.push({
                    id: "home",
                    name: "home",
                    displayname: "Top Stories",
                    newsurl: "http://api.espn.com/v1/sports/news"
                });

                ESPN.Ajax = $.manageAjax.create('news', { maxRequests: 1, queue: true, cacheResponse: false });
            },

            GetNumericDate: function (date) {
                var d = parseInt(String(date.getFullYear()) + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2));
                return d;
            },

            SaveBookmark: function (article, $div) {
                if (Modernizr.localstorage) {
                    var list;
                    var localList = localStorage.getItem(ESPN.Bookmarks);
                    if (localList == null) {
                        list = { Stream: { headlines: []} };
                    } else {
                        list = JSON.parse(localList);
                    }

                    var found = false;
                    $.each(list.Stream.headlines, function () {
                        if ($(this)[0].id == article.id) {
                            found = true;
                        }
                    });
                    if (found == false) {
                        article.bookmark = "bookmarked";
                        list.Stream.headlines.push(article);
                    }

                    try {
                        localStorage.setItem(ESPN.Bookmarks, JSON.stringify(list));
                        $div.attr("state", "bookmarked");
                        $div.attr("title", "remove bookmark");
                        $div.addClass("bookmarked");

                    } catch (e) {
                        if (e == QUOTA_EXCEEDED_ERR) {
                            $("#msg").text("Unable to bookmark. You might have exceeded the local storage limit.");
                        }
                    }
                }
            },

            RemoveBookmark: function (article, $div) {
                if (Modernizr.localstorage) {
                    var list;
                    var localList = localStorage.getItem(ESPN.Bookmarks);
                    if (localList == null) {
                        list = { Stream: { headlines: []} };
                    } else {
                        list = JSON.parse(localList);
                    }

                    $.each(list.Stream.headlines, function (index, e) {
                        if ($(this)[0].id == article.id) {

                            list.Stream.headlines.splice(index, 1);
                        }
                    });
                    localStorage.setItem(ESPN.Bookmarks, JSON.stringify(list));
                    $div.attr("state", "");
                    $div.attr("title", "bookmark");
                    $div.removeClass("bookmarked");
                }

            },

            GetBookmarksRaw: function () {
                var localList = localStorage.getItem(ESPN.Bookmarks);
                return localList;
            },

            GetBookmarks: function () {
                var localList = ESPN.GetBookmarksRaw();
                var f = false;
                if (localList != null) {
                    var l = JSON.parse(localList);
                    Ui.reset();
                    Current.Stream = l.Stream;
                    if (l.Stream.headlines.length > 0) {
                        f = true;
                        Ui.showHeadlines(l.Stream);
                        $("#msg").empty().text("Currently bookmarks are stored in the local browser storage; You will not be able to access these from other browsers or machines.");
                    }
                }
                if (f == false) {
                    $("#msg").empty().text("You have not bookmarked any article.");
                    $("#msg").append($('#adspanel .boxad').clone().css("margin-top", '2em'));
                    $("#main").show();
                }
            }

        };

        $(function () {
            ESPN.Init();
            ESPN.Reset();
            ESPN.GetSportsList();

            $(document).on("click", "#sports li span", function (e) {
                ESPN.Reset();
                var name = $(this).attr("name");
                var state = {};
                state["p"] = name;
                $.bbq.pushState(state);
                $.bbq.removeState("l");
                $.bbq.removeState("i");
                Current.Page = name;
                Ui.highlightMenu();
            });

            $(document).on("click", "#leagues li span", function (e) {
                ESPN.Reset();
                var name = $(this).attr("name");
                var state = {};
                state["l"] = name;
                $.bbq.pushState(state);
                $.bbq.removeState("i");
                $("#headlines li").remove();
                Current.League = name;
                Ui.highlightMenu();
            });

            $(document).on("click", ".bookmark", function (e) {
                var id = $(this).attr("articleid");

                var state = $(this).attr("state");
                var $div = $(this);

                $.each(Current.Stream.headlines, function () {
                    var h = $(this)[0];

                    if (h.id == id) {
                        if (state == "") {
                            ESPN.SaveBookmark(h, $div);
                        } else {
                            ESPN.RemoveBookmark(h, $div);
                        }
                    }
                });

                if (Current.Page == "bookmarks") {
                    ESPN.GetBookmarks();
                }
            });

            $(window).bind('hashchange', function (e) {
                ESPN.Reset();
                var parameters = $.bbq.getState();
                Current.Page = parameters["p"];
                Current.ArticleID = parameters["i"];
                Current.League = parameters["l"];

                if (Current.Page != null)
                    document.title = "Sports News Pub - " + Current.Page;

                if (Current.League != null)
                    document.title = document.title + " - " + Current.League;

                if (Current.Page == null) Current.Page = "home";

                $.doTimeout(ESPN.Lag, function () {
                    if (Current.ArticleID) {
                        Current.Context = Contexts.Article;
                        ESPN.GetArticle(Current.ArticleID);
                    } else if (Current.Page) {
                        Current.Stream.headlines = [];
                        $("#leagues li").remove();
                        Current.Context = Contexts.News;
                        if (Current.Page == "bookmarks") {
                            ESPN.GetBookmarks();
                        } else {
                            $.each(ESPN.Sports, function () {
                                if (this.name == Current.Page) {
                                    if (Current.League) {
                                        ESPN.CurrentSportName = this.name;
                                        ESPN.NewsContextAPI = ESPN.LeagueAPI + ESPN.CurrentSportName.toLowerCase() + "/" + Current.League.toLowerCase() + "/news";
                                        ESPN.NewsContextHeading = ESPN.CurrentSportName.toLowerCase() + "/" + Current.League.toLowerCase();

                                    } else {

                                        ESPN.CurrentSportName = this.name;
                                        ESPN.NewsContextAPI = this.newsurl;
                                        ESPN.NewsContextHeading = this.displayname;
                                    }

                                    if (ESPN.CurrentSportName != "home" && ESPN.CurrentSportName != "bookmarks") {
                                        ESPN.GetLeaguesList(ESPN.CurrentSportName);
                                    }
                                    ESPN.GetNews();
                                }
                            });
                        }
                    }
                    Ui.highlightMenu();
                });

            });

            $(window).trigger('hashchange');
            Ui.ready();

            $(window).endlessScroll({
                fireOnce: true,
                fireDelay: 1500,
                bottomPixels: 500,
                callback: function (p) {
                    if (Current.Context == 'news' && Current.Page != "bookmarks") {
                        ESPN.Offset += 10;
                        if (ESPN.Offset > Current.ResultCount) {
                            ESPN.Date.setDate(ESPN.Date.getDate() - 1);
                            ESPN.NDate = ESPN.GetNumericDate(ESPN.Date);
                            ESPN.Offset = 1;
                        }
                        $.doTimeout(ESPN.Lag, function () {
                            ESPN.GetNews();
                        });

                    }
                }
            });

        });

    });
})();