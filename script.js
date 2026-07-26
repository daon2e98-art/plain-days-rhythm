// 날짜 표시
const STORAGE_KEY = "plain-days-rhythm";
const today = new Date();

const days = [
"Sunday",
"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday",
"Saturday"
];


document.getElementById("day").innerHTML =
days[today.getDay()];


document.getElementById("date").innerHTML =
today.getDate()
+
" "
+
today.toLocaleString(
"en",
{
month:"long",
year:"numeric"
}
);



// 체크 기능

function toggleHabit(item){

    const button=item.querySelector("button");

    if(button.innerHTML==="○"){

        button.innerHTML="●";

        button.classList.add("checked");

    }else{

        button.innerHTML="○";

        button.classList.remove("checked");

    }

    updateProgress();
    saveHabits();

}





// 퍼센트 계산

function updateProgress(){

    const total =
    document.querySelectorAll("button").length;


    const checked =
    document.querySelectorAll(".checked").length;


    const percent =
    Math.round(
        checked / total * 100
    );


    document.getElementById("percent")
    .innerHTML =
    percent+"%";

}


function saveHabits(){

    const habits=[];

    document.querySelectorAll(".habit").forEach(habit=>{

        const checked=
        habit.querySelector("button")
        .classList.contains("checked");

        habits.push(checked);

    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(habits)
    );

}


function loadHabits(){

    const data=
    JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    );

    if(!data) return;

    document.querySelectorAll(".habit").forEach((habit,index)=>{

        const button=
        habit.querySelector("button");

        if(data[index]){

            button.innerHTML="●";
            button.classList.add("checked");

        }

    });

    updateProgress();

}

loadHabits();
