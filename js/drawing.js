var path, ink, chart, scores;
var timer = 0, lastTimestamp = 0, lastTimestamp_check = 0, idx_guess = 0;
var d_scores = {}
var su, cc, can, co;
var d;

paper.install(window);
window.onload = function() {

  initInk();             
  paper.setup('canvas');  

  var tool = new Tool();  

  cc = $('.best-guess-word').text();
  tool.onMouseDown = function(event) {
 
    path = new Path();          
    path.strokeColor = 'blue'; 
    path.strokeWidth = 5;

    var thisTimestamp = event.event.timeStamp;
    if(timer === 0){
      timer = 1; 
      var time = 0;
    }else{
      var timeDelta = thisTimestamp - lastTimestamp;
      var time = ink[2][ink[2].length-1] + timeDelta;
    }
    
    updateInk(event.point, time);
    path.add(event.point);
    
    lastTimestamp = thisTimestamp;
  }

  tool.onMouseDrag = function(event) {
    var thisTimestamp = event.event.timeStamp ;
    var timeDelta = thisTimestamp - lastTimestamp;
    var time = ink[2][ink[2].length-1] + timeDelta;
    updateInk(event.point, time);
    path.add(event.point);
    
    lastTimestamp = thisTimestamp;
 
    if(thisTimestamp - lastTimestamp_check > 250){
      checkQuickDraw();
      lastTimestamp_check = thisTimestamp;
    }
  }
  initInfoModal();
}
function initInk(){
  ink = [[],[],[]];
}
function clearDrawing() {
  paper.project.activeLayer.removeChildren();
  paper.view.draw();
  initInk();
  timer = 0;
  idx_guess = 0;
  d_scores = {};
  chart.destroy();

}
function updateInk(point, time){
  ink[0].push(point.x);
  ink[1].push(point.y);
  ink[2].push(time);
}
function getCanvasDimensions(){
  var w = document.getElementById('canvas').offsetWidth;
  var h = document.getElementById('canvas').offsetHeight;
  return {height: h, width: w};
}
function checkQuickDraw(){
  var c_dims = getCanvasDimensions();
  var url = 'https://inputtools.google.com/request?ime=handwriting&app=quickdraw&dbg=1&cs=1&oe=UTF-8'
  var headers = {
    'Accept': '*/*',
    'Content-Type': 'application/json'
  };
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  Object.keys(headers).forEach(function(key,index) {
      xhr.setRequestHeader(key, headers[key]); 
  });
  xhr.onload = function() {
    if (xhr.status === 200) {
      res = xhr.responseText; 
      parseResponse(res);     
      idx_guess += 1;         
    }
    else if (xhr.status !== 200) {
      console.log('Request failed.  Returned status of ' + xhr.status);
    }
  };
  var data = {
    "input_type":0,
    "requests":[
      {
        "language":"quickdraw",
        "writing_guide":{"width": c_dims.width, "height":c_dims.height},
        "ink": [ink]
      }
    ]
  };
  var request_data = JSON.stringify(data);
  xhr.send(request_data);

}
function parseResponse(res){
  var res_j = JSON.parse(res);
  scores = JSON.parse(res_j[1][0][3].debug_info.match(/SCORESINKS: (.+) Combiner:/)[1]);
  updateScoresHistory();
  plotScores_Highcharts();

}

function updateScoresHistory(){
  var current_guesses = [];
  for(ii=0; ii<scores.length; ii++){
    var guess = scores[ii][0];
    var score = scores[ii][1];
    current_guesses.push(guess)
    
    if(guess in d_scores){
      d_scores[guess].push(score); 
    }else{
      d_scores[guess] = createArray(idx_guess+1, null);
      d_scores[guess][idx_guess] = score;
    }
  }
  for(guess in d_scores){
    if(current_guesses.indexOf(guess) == -1){
      d_scores[guess].push(null);
    }
  }

}
function getData_Highcharts(){
  var p_data = [];
  for(d_scores_i in d_scores){
    var guesses = d_scores[d_scores_i];
    p_data.push({
      name: d_scores_i,
      data: guesses
    })
  }
  var p_x = Array.apply(null, {length: p_data[0].data.length}).map(function(value, index){
    return String(index + 1);
  });

  o = {
    p_labels: p_x,
    p_data: p_data
  }
  return o;

}
var clock;
    
$(document).ready(function() {
      
  clock = $('.clock').FlipClock(20, {
    clockFace: 'MinuteCounter',
    countdown: true,
    autoStart: false,
    callbacks: {
      start: function() {
        cc = $('.best-guess-word').text();
        d = Math.floor((Math.random() * 10) + 1);
      },
      stop: function() {
        $('.modal').css('display', 'block');

        if (su == cc) {
          $('.messageout').html('Drawing is correct!');
        }else{
          $('.messageout').html('Drawing is failed!');
        }

        paper.project.activeLayer.removeChildren();
        paper.view.draw();
        clock.reset();
      }
    }
  });
  $('.start').click(function(e) {

    clock.start();

  });

  $('#popup-quit-quit').click(function() {
    $('.modal').css('display', 'block');
      clock.stop();
    $('#popup-quit').addClass('hidden');
  });

  $('#popup-quit-cancel').click(function() {
    $('#popup-quit').addClass('hidden');
  });

  setTimeout(function() {$('body').css('opacity', 1);}, 600);
});

function plotScores_Highcharts() {
  su = scores[0][0];
  if (su == cc) {
    can = 'Succesful!';
    co = true;
  }else{
    can = '  ';
    co = false;
  }
  var p_o = getData_Highcharts(); 
  var p_title = 'I see : ' + scores[0][0] + ' : ' + can;
  

  $('.best-guess-word').text(scores[d][0]);
  setTimeout(function(){
    chart = Highcharts.chart('plot', {

      title: {
        text: p_title
      },

      legend: {
        enabled: false
      },

      series: p_o.p_data
  });
  }, 1000);
  

    if (co == true) {
      setTimeout(function(){     
        $('.modal').css('display', 'block');
        clearDrawing();
        clock.stop();
        $('#popup-quit').addClass('hidden'); }, 4000);
    }
};
function createArray(len, itm) {
    var arr1 = [itm],
        arr2 = [];
    while (len > 0) {
        if (len & 1) arr2 = arr2.concat(arr1);
        arr1 = arr1.concat(arr1);
        len >>>= 1;
    }
    return arr2; 

}



function initInfoModal(){

  var modal = document.getElementById('info');

  var btn = document.getElementById("btnInfo");

  var span = document.getElementsByClassName("close")[0];

  btn.onclick = function() {
 
      $('#popup-quit').removeClass('hidden');
  }
  span.onclick = function() {
      modal.style.display = "none";
      clock.start();
  }


    $('.start').click(function(e) {

    clock.start();

  });


  $('#popup-quit-quit').click(function() {
    $('.modal').css('display', 'block');
      clearDrawing();
      clock.stop();
    $('#popup-quit').addClass('hidden');
  });

  $('#popup-quit-cancel').click(function() {
    $('#popup-quit').addClass('hidden');
  });

   $('.checkn').click(function(e) {

    $('#timesup-card').css('display', 'block');

  });

    setTimeout(function() {$('body').css('opacity', 1);}, 600);  

  document.getElementById('info').style.display = "block";
  
}