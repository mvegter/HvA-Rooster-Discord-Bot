/*
This file (index.js) is part of HvA-Rooster-Discord-Bot.
Copyright (C) 2017  Martijn Vegter

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const Discord = require('discord.js');
const ical = require('ical');
const dateFormat = require('dateformat');
const client = new Discord.Client();

client.on('ready', () => {
    var server = client.guilds.find("name", "TI102");
    if (server === null) throw "Couldn't find server 'TI102'";
    console.log('I am ready!');
});


function TodayOrNext(num) {
    var d = new Date();
    d.setDate(d.getDate() + ((num + 7 - d.getDay()) % 7) % 7);
    return d;
}

client.on('message', message => {
  var userMessage = message.content.toLowerCase();

    if (message.content == '!help') {
        message.channel.send(
          "``` !rooster ```" +
          "``` !rooster morgen ```" +
          "``` !rooster (dag-maand-jaar) ```");
    }

    if (userMessage.startsWith("wat hebben we") || userMessage.startsWith("welke lessen hebben we")) {
      var dag = userMessage.replace("wat hebben we ", "").replace("welke lessen hebben we ", "").replace("?", "");

      switch (dag) {
          case "maandag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(1), "d-m-yy");
              break;
          case "dinsdag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(2), "d-m-yy");
              break;
          case "woensdag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(3), "d-m-yy");
              break;
          case "donderdag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(4), "d-m-yy");
              break;
          case "vrijdag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(5), "d-m-yy");
              break;
          case "zaterdag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(6), "d-m-yy");
              break;
          case "zondag":
              userMessage = "!rooster " + dateFormat(TodayOrNext(0), "d-m-yy");
              break;
          default:
              userMessage = "!rooster";
              break;
        }
    }

    if (userMessage.startsWith("!rooster")) {
        ical.fromURL("http://rooster.hva.nl/ical?59b29cf8&group=false&deduplicate=true&eu=dmVndGVybQ==&h=4T4PjWb2PaBj8giw29sfeXptd3zWjqk55KhUQw6Yb6U=", {}, function(err, data) {
            var response = "";
            var vandaag = dateFormat(new Date(), "shortDate");

            var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
            var morgen = dateFormat(tomorrow, "shortDate");

            for (var moment in data) {
                if (data.hasOwnProperty(moment)) {
                    var ev = data[moment];

                    if (userMessage == "!rooster" || userMessage.indexOf("vandaag") > -1) {
                        if (dateFormat(ev.start, "shortDate") != vandaag) {
                            continue;
                        }
                    } else if (userMessage.indexOf("morgen") > -1) {
                        if (dateFormat(ev.start, "shortDate") != morgen) {
                            continue;
                        }
                    } else if (userMessage.split(" ").length > 1) {
                        var userDate = userMessage.substring(userMessage.indexOf(" ") + 1);

                        var day = userDate.split("-")[0];
                        var month = userDate.split("-")[1];
                        var year = userDate.split("-")[2];

                        var userDate = "" + month + "-" + day + "-" + year + "";

                        if (dateFormat(ev.start, "shortDate") != dateFormat(userDate, "shortDate")) {
                            continue;
                        }
                    } else {
                        continue;
                    }

                    var startTijd = dateFormat(ev.start, "isoTime");
                    var eindTijd = dateFormat(ev.end, "isoTime");

                    if (ev.summary == undefined || startTijd == eindTijd) {
                        continue;
                    }

                    if (ev.location == "" || ev.location == null) {
                        ev.location = "Onbekende Locatie";
                    }

                    response += "```" + startTijd + " - " + eindTijd + " || " + ev.location + " || " + ev.summary + "```";
                }
            }
            if (response == "") {
                response = "``` Helemaal niks op het rooster :) ```"
            }
            message.channel.send(response);
        });
    }
});

client.login('BOT TOKEN');
