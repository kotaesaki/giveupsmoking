const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 5000;
const line = require("@line/bot-sdk");
const config = {
  channelAccessToken: process.env.ACCESS_TOKEN,
  channelSecret: process.env.SECRET_KEY
};
const client = new line.Client(config);


var startTime;

//1日に吸うタバコの量
var dTabacco;
//一箱の値段
var priceTabacco;
const life = 11;



const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.ENV_HOST,
  databese: process.env.ENV_DB,
  user: process.env.ENV_USER,
  port: process.env.ENV_PORT, 
  password: process.env.ENV_PW,
});


express()
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  .get("/g/", (req, res) => res.json({ method: "こんにちは、getさん" }))
  .post("/p/", (req, res) => res.json({ method: "こんにちは、postさん" }))
  .post("/hook/", line.middleware(config), (req, res) => lineBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

function lineBot(req, res) {
  res.status(200).end();
  // ここから追加
  const events = req.body.events;
  const promises = [];
  for (let i = 0, l = events.length; i < l; i++) {
    const ev = events[i];
    promises.push(
      echoman(ev)
    );
  }
  Promise.all(promises).then(console.log("pass"));
}

// 追加
async function echoman(ev) {
  const pro =  await client.getProfile(ev.source.userId);
  const id = ev.source.userId;
  console.log(pro);


    await pool.connect(function(err,client,relaese){
    if(err){
      console.log("接続エラー");
      console.log(pool);
      console.log("------------------------------------------");
      console.log(err);
    }else{
      console.log("接続成功");
      let queryuid = client.query("SELECT uid FROM tabacco where uid = '" + id +"';", function(err,result){
        console.log("queryuid:"+ result.rows);
        //ユーザIDがdbに登録されていない場合
        if(result.rows == null || result.rows == '' ){
          console.log("登録中");
          client.query("INSERT INTO tabacco(uid) VALUES ('" + id + "');");

        //ユーザIDがdbに登録されている場合
        }

        relaese();

      });

      

    }
  });




  //return client.replyMessage(ev.replyToken, {
  //  type: "text",
  //  text: `${pro.displayName}さん、今「${ev.message.text}」って言いました？`
  //})



  if(ev.message.text == "タバコ吸いたい" || ev.message.text == "たばこ吸いたい" || ev.message.text == "煙草吸いたい"){
  	return client.replyMessage(ev.replyToken, [
  	{
  		type: "image",
  		originalContentUrl: "https://blog-imgs-141.fc2.com/e/s/a/esaesaesaki/hai.jpg",
    	previewImageUrl: "https://blog-imgs-141.fc2.com/e/s/a/esaesaesaki/hai.jpg"
    },
    {  	
  		type: "text",
  		text: "こうなりたくなかったら頑張って"
  	}
  	])
  } 


  if(ev.message.text == "禁煙スタート"){
  	//クリック時の時間を保持するための変数定義
    //経過時刻を更新するための変数。 初めはだから0で初期化
    var elapsedTime = 0;
    //タイマーを止めるにはclearTimeoutを使う必要があり、
    //そのためにはclearTimeoutの引数に渡すためのタイマーのidが必要

    await pool.connect(function(err,client,relaese){
    if(err){
      console.log("接続エラー");
      console.log(pool);
      console.log("------------------------------------------");
      console.log(err);
    }else{
      console.log("接続成功");
      let queryTime = client.query("UPDATE tabacco SET starttime = '" + Date.now() +"' WHERE uid = '" + id +"'; ");
      client.query("SELECT * FROM tabacco where uid = '" + id +"';", function(err,result){
        console.log("Result:" + result.rows[0].starttime);
        startTime = result.rows[0].starttime;
        console.log("現在時刻：" + startTime);

        relaese();
      });

    }
  });

    setTimeout(() => {

    console.log(startTime);

    return client.replyMessage(ev.replyToken, {
  	type: "text",
    text: `禁煙頑張りましょう`
  	})

  },1000)


  }

  if(ev.message.text == "タバコ吸ってもた"){

    startTime = 0;


    setTimeout(() => {

  	return client.replyMessage(ev.replyToken, {
  	type: "text",
    text: `また気が向いたら禁煙しましょう`
  	})

    },1000)


  }

  if(ev.message.text == "今何日目？"){

      if(startTime == 0){
      return client.replyMessage(ev.replyToken, {
      type: "text",
      text: `禁煙スタートを押してね`
    })
    }
    await pool.connect(async function(err,client,relaese){
    if(err){
      console.log("接続エラー");
      console.log(pool);
      console.log("------------------------------------------");
      console.log(err);
    }else{
      console.log("接続成功");
      let result = await client.query("SELECT * FROM tabacco where uid = '" + id +"';");
      console.log("Result:" + result.rows[0].starttime);
      startTime = result.rows[0].starttime;
      console.log("現在時刻：" + startTime);
      let result1 = await client.query("SELECT frequency FROM tabacco where uid = '" + id +"';");
      console.log("Result:" + result1.rows[0].frequency);
      dTabacco = result1.rows[0].frequency;
      console.log("吸う量：" + dTabacco);
      
      let result2 = await client.query("SELECT price FROM tabacco where uid = '" + id +"';");
      console.log("Result:" + result2.rows[0].price);
      priceTabacco = result2.rows[0].price;
      console.log("一箱：" + priceTabacco);

      relaese();
      
    }
  });  


    setTimeout(() => {

    console.log("現在時刻:" + startTime);


  	elapsedTime = Date.now() - startTime;
  	//年
    var y = Math.floor(elapsedTime / 31536000000);

	   //日
    var d = Math.floor(elapsedTime % 31536000000 / 86400000);
	
	   //時
    var h = Math.floor(elapsedTime % 86400000 / 3600000);

  	//m(分) = 135200 / 60000ミリ秒で割った数の商　-> 2分
    var m = Math.floor(elapsedTime % 3600000 / 60000);

    //s(秒) = 135200 % 60000ミリ秒で / 1000 (ミリ秒なので1000で割ってやる) -> 15秒
    var s = Math.floor(elapsedTime % 60000 / 1000);

    //ms(ミリ秒) = 135200ミリ秒を % 1000ミリ秒で割った数の余り
    var ms = elapsedTime % 1000;

    //節約金額
    var setsuyaku = Math.round((priceTabacco / dTabacco)* elapsedTime / 86400000 * 100000) / 100000;
    var jumyo = Math.round(elapsedTime / 86400000 * dTabacco * life *100000) / 100000;

    console.log("経過時間" + elapsedTime);
    console.log("節約金額" + setsuyaku);
    console.log("寿命" + jumyo);

 
    return client.replyMessage(ev.replyToken, {
  	type: "text",
    text: `${y}年 ${d}日 ${h}時間 ${m}分 ${s}秒 ${ms}　経過しました。

${setsuyaku}円節約できました。

${jumyo}分寿命が伸びました。`
  	})

  },1500)

  }


  if(ev.message.text == "設定"){
  	return client.replyMessage(ev.replyToken, {
  	type: "text",
    text: `1日に吸うタバコの本数を半角数字で教えてください`
  	})

  }

  if(ev.message.text <= 99){

    pool.connect(await function(err,client,relaese){
    if(err){
      console.log("接続エラー");
      console.log(pool);
      console.log("------------------------------------------");
      console.log(err);
    }else{
      console.log("接続成功");
      let queryFrequency = client.query("UPDATE tabacco SET frequency = '" + ev.message.text +"' where uid = '" + id +"'; ");
      client.query("SELECT * FROM tabacco where uid = '" + id +"';", function(err,result){
        console.log("Result:" + result.rows[0].frequency);
        dTabacco = result.rows[0].frequency;
        console.log("吸う量：" + dTabacco);
      });

      relaese();
    }
    });

    setTimeout(() => {

  	return client.replyMessage(ev.replyToken, [
  	{
  	type: "text",
    text: `1日に吸う量を${dTabacco}本に設定しました。`
  	},
  	{
  	type:"text",
  	text:"吸っているタバコは一箱何円ですか？半角数字で教えてください"
  	}])
  },1500)
  }

  if(ev.message.text >= 250){

    pool.connect(await function(err,client,relaese){
    if(err){
      console.log("接続エラー");
      console.log(pool);
      console.log("------------------------------------------");
      console.log(err);
    }else{
      console.log("接続成功");
      const tabaccoQuery = client.query("SELECT * FROM tabacco;");
      let queryFrequency = client.query("UPDATE tabacco SET price = '" + ev.message.text +"' where uid = '" + id +"'; ");
      client.query("SELECT * FROM tabacco where uid = '" + id +"';", function(err,result){
        console.log("Result:" + result.rows[0].price);
        priceTabacco = result.rows[0].price;
        console.log("一箱：" + priceTabacco);
      });

      relaese();
    }
    });

    setTimeout(() => {

  	return client.replyMessage(ev.replyToken, [
  	{
  	type: "text",
    text: `一箱を${priceTabacco}円に設定しました。`
  	},
  	{
  	type:"text",
  	text:"これで設定を終わります。"
  	}])

  },1500)


  }


}
