<script setup lang="ts">

defineProps<{
 date:string
}>()

</script>


<template>


<header class="hero">


<div class="blur-one"></div>
<div class="blur-two"></div>








<div class="content">


<h1>
今天
</h1>


<p class="date">
{{date}}
</p>



<p class="slogan">

继续恢复，慢慢变好

<span>
🌱
</span>

</p>


</div>



</header>


</template>



<style scoped>


.hero{


position:relative;


overflow:hidden;


padding:

14px

24px

30px;


background:

linear-gradient(

180deg,

rgba(52,199,89,.12) 0%,

rgba(242,242,247,0) 85%

);


}



.blur-one{


position:absolute;


width:

220px;


height:

220px;


top:-100px;


left:-70px;


border-radius:50%;


background:

rgba(52,199,89,.16);


filter:

blur(50px);


}



.blur-two{


position:absolute;


width:

180px;


height:

180px;


top:-80px;


right:-60px;


border-radius:50%;


background:

rgba(88,86,214,.10);


filter:

blur(55px);


}




.nav{


position:relative;


display:flex;


justify-content:space-between;


align-items:center;


}



.app-mark{


width:

38px;


height:

38px;


border-radius:

50%;


background:

rgba(255,255,255,.65);


backdrop-filter:

blur(20px);


display:flex;


align-items:center;


justify-content:center;


font-size:

20px;


box-shadow:

0 5px 20px rgba(0,0,0,.06);


}




.more{


width:

38px;


height:

38px;


border:

0;


border-radius:

50%;


background:

rgba(255,255,255,.55);


backdrop-filter:

blur(20px);


display:flex;


align-items:center;


justify-content:center;


color:

var(--text2);


}



.content{


position:relative;


margin-top:

36px;


}



h1{


margin:

0;


font-size:

46px;


font-weight:

800;


letter-spacing:

-2px;


}



.date{


margin:

8px 0 0;


font-size:

16px;


color:

var(--text2);


}



.slogan{


margin-top:

22px;


font-size:

17px;


font-weight:

600;


  color:

    var(--text2);


}



.slogan span{


font-size:

18px;


}



</style>