<?php

/* $Revision: 1.00$ */
/* $Id: DailySalesInquiry.php 4090 2010-10-02 15:04:45Z tim_schofield $*/
/* 2020MAY10 By Adel - Comisiones por salesman y no por locations */

//$PageSecurity = 12;
$PageSecurity = 2;

include('includes/session.inc');
$title = _('Daily Sales Inquiry');
include('includes/header.inc');
include('includes/DefineCartClass.php');
require_once('funciones_usadas.php');
//echo "<pre>";
// UserStockLocation
// var_dump(GetPeriod(Date($_SESSION['DefaultDateFormat']),$db));
//print_r($_SESSION);
//echo "</pre>";
// var_dump($_SESSION['SalesmanLogin']);
echo '<p class="page_title_text"><img src="'.$rootpath.'/css/'.$theme.'/images/transactions.png" title="' . _('Daily Sales') . '" alt="">' . ' ' . _('Daily Sales') . '</p>';
echo '<div class="page_help_text">' . _('Select the month to show daily sales for') . '</div><br>';

echo '<form action="' . $_SERVER['PHP_SELF'] . '" method="post">';
echo '<input type="hidden" name="FormID" value="' . $_SESSION['FormID'] . '" />';

echo '<table cellpadding=2 class=selection><tr>';

echo '<td>' . _('Month to Show') . ':</td><td><select tabindex=1 name="MonthToShow" id="periodo">';


if (!isset($_POST['MonthToShow'])){
    $_POST['MonthToShow'] = GetPeriod(Date($_SESSION['DefaultDateFormat']),$db);
}

$PeriodsResult = DB_query('SELECT periodno, lastdate_in_period, date_format(lastdate_in_period,"%Y-%m") periodo_year_month FROM periods',$db);

while ($PeriodRow = DB_fetch_array($PeriodsResult)){
    if ($_POST['MonthToShow']==$PeriodRow['periodno']) {
         echo '<option selected Value="' . $PeriodRow['periodno'] . '">' . MonthAndYearFromSQLDate($PeriodRow['lastdate_in_period']) . '</option>';
         $EndDateSQL = $PeriodRow['lastdate_in_period'];
         $periodo_year_month = $PeriodRow['periodo_year_month'];
    } else {
         echo '<option Value="' . $PeriodRow['periodno'] . '">' . MonthAndYearFromSQLDate($PeriodRow['lastdate_in_period']) . '</option>';
    }
}
echo '</select></td>';
echo '<td>' . _('Salesperson') . ':</td><td><select tabindex=2 name="Salesperson" id="location">';

$SalespeopleResult = DB_query('SELECT salesmancode, salesmanname FROM salesman',$db);
if ($_SESSION['SalesmanLogin']) {
    while ($SalespersonRow = DB_fetch_array($SalespeopleResult)){

        if ($_SESSION['SalesmanLogin']==$SalespersonRow['salesmancode']) {
             echo '<option selected value="' . $SalespersonRow['salesmancode'] . '">' . $SalespersonRow['salesmanname'] . '</option>';
        } 
    }
}else{
    
if (!isset($_POST['Salesperson'])){
    $_POST['Salesperson'] = 'All';
    echo '<option selected value="All">' . _('All') . '</option>';
} else {
    echo '<option value="All">' . _('All') . '</option>';
}
	echo "<option ".( @$_POST['Salesperson']=="Propios" ? "selected" : "" )." value='Propios'>" . _('Almacenes Propios');

while ($SalespersonRow = DB_fetch_array($SalespeopleResult)){

    if ($_POST['Salesperson']==$SalespersonRow['salesmancode']) {
         echo '<option selected value="' . $SalespersonRow['salesmancode'] . '">' . $SalespersonRow['salesmanname'] . '</option>';
    } else {
         echo '<option Value="' . $SalespersonRow['salesmancode'] . '">' . $SalespersonRow['salesmanname'] . '</option>';
    }
}
}
echo '</select></td>';

echo '</tr></table><br />
	<div class="centre" style="width:516px;">
		<input tabindex=4 type=submit name="ShowResults" VALUE="' . _('Show Daily Sales For The Selected Month') . '">';
?>
<style>
	.btn-grafico{
		/*float:right;*/
		display:inline-block;
		vertical-align:middle;
	}
	
	.col-4{
		float:left;
		width:33.33333333%;
	}
	
	.col-half{
		width:50%;
		margin:auto;
	}
	
	.clearfix:before,
	.clearfix:after{
	  display: table;
	  content: " ";
	}
	
	.clearfix:after {
	  clear: both;
	}
</style>
		<a href="#" title="cargar grafico" class="btn-grafico" id="btn-cargar-grafico"><img src="img/boton-grafico.png" alt="cargar grafico" style="width:30px;height:auto;" /></a>
<?php
echo '</form></div>';
echo '<br />';
/*Now get and display the sales data returned */
if (strpos($EndDateSQL,'/')) {
    $Date_Array = explode('/',$EndDateSQL);
} elseif (strpos ($EndDateSQL,'-')) {
    $Date_Array = explode('-',$EndDateSQL);
} elseif (strpos ($EndDateSQL,'.')) {
    $Date_Array = explode('.',$EndDateSQL);
}

if (strlen($Date_Array[2])>4) {
    $Date_Array[2]= substr($Date_Array[2],0,2);
}
/*
SalesmanLogin
*/
$StartDateSQL =  date('Y-m-d', mktime(0,0,0, (int)$Date_Array[1],1,(int)$Date_Array[0]));

$sql = "SELECT  stockmoves.trandate,
                SUM(price*(1-discountpercent)* (-qty)) as salesvalue,
                SUM((standardcost * -qty)) as cost,
                SUM((price*(1-discountpercent)*(taxrate)* (-qty))) as salesvalueiva,
                SUM(debtortrans.ovfreight / IF(debtortrans.rate IS NULL, 1, debtortrans.rate)) as freightvalue_freight,
                if( comision_ventas.descuentos is null,0,comision_ventas.descuentos ) as discoutsvalue,
                
                SUM((stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate ))*(1-discountpercent)* (-qty)) + SUM(((stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate ))*(1-discountpercent)*(taxrate)* (-qty))) ventasDolares,
                if(comision_ventas.comision is null,0,comision_ventas.comision) comision_ventas
                
            FROM stockmoves
                INNER JOIN custbranch ON
					stockmoves.debtorno=custbranch.debtorno
                    AND stockmoves.branchcode=custbranch.branchcode
					
				left join debtortrans on
					debtortrans.transno = stockmoves.transno
					
				left join(
					select
					
					ventas_mes_location.trandate_year_month,
					sum(
						if(
							ventas_mes_location.ventas <= if(metas_periodo.meta is null,0,metas_periodo.meta),
							ventas_mes_location.ventas * salesman.commissionrate1 / 100,
							if(metas_periodo.meta is null,0,metas_periodo.meta) * salesman.commissionrate1 / 100
							+
							( ventas_mes_location.ventas - if(metas_periodo.meta is null,0,metas_periodo.meta) ) * salesman.commissionrate2 / 100
						)
					) as comision,
					sum( ventas_mes_location.descuentos ) as descuentos
					
					from (
						select
						
						custbranch.salesman loccode,
						date_format(stockmoves.trandate,'%Y-%m') trandate_year_month,
						SUM( (( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) - ( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) * stockmoves.discountpercent)) + (( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) - ( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) * stockmoves.discountpercent)) * stockmovestaxes.taxrate)) * -stockmoves.qty ) ventas,
						SUM( stockmoves.price  / if( debtortrans.rate is null,1,debtortrans.rate ) * ( stockmoves.discountpercent ) * ( -stockmoves.qty ) ) as descuentos
						
						from stockmoves
							inner join custbranch on
								custbranch.branchcode = stockmoves.branchcode
							inner join stockmovestaxes on
								stockmovestaxes.stkmoveno = stockmoves.stkmoveno
							left join debtortrans on
								debtortrans.transno = stockmoves.transno
								
						";
						
						if( @$_POST["Salesperson"] == "Propios" ){
							$sql.="
								inner join locations on
									locations.loccode = custbranch.salesman
								inner join companies on
									companies.companynumber = locations.branchcode
							";
						}
						
						$sql.="
						where
							(stockmoves.type=10 or stockmoves.type=11)
							and date_format(stockmoves.trandate,'%Y-%m') = '" . $periodo_year_month . "'
						";
						if( @$_POST["Salesperson"] <> "Propios" and @$_POST["Salesperson"] <> "All" ){
							$sql.="
							and custbranch.salesman = '".@$_POST["Salesperson"]."'
							";
						}
						$sql.="

						group by
							trandate_year_month,
							custbranch.salesman
					) ventas_mes_location
					left join metas_periodo on
						metas_periodo.UserStockLocation = ventas_mes_location.loccode
						and metas_periodo.periodo = '" . @$_POST["MonthToShow"] . "'
					left join salesman on
						salesman.salesmancode = ventas_mes_location.loccode
				) comision_ventas on
					comision_ventas.trandate_year_month = date_format(stockmoves.trandate,'%Y-%m')
					
				";
				
				if( @$_POST['Salesperson'] == "Propios" ){
					$sql.="
						inner join locations on
							locations.loccode = stockmoves.loccode
						inner join companies on
							companies.companynumber = locations.branchcode
					";
				}
				
				$sql.="
				
                LEFT JOIN stockmovestaxes ON stockmoves.stkmoveno=stockmovestaxes.stkmoveno
            WHERE (stockmoves.type=10 or stockmoves.type=11)
            AND show_on_inv_crds =1
            AND date_format(stockmoves.trandate,'%Y-%m') = '" . $periodo_year_month . "'";
            
if ($_POST['Salesperson']!='All' and $_POST['Salesperson']!='Propios') {
    $sql .= " AND stockmoves.loccode='" . $_POST['Salesperson'] . "'";
}

$sql .= " GROUP BY stockmoves.trandate ORDER BY stockmoves.trandate";
$ErrMsg = _('The sales data could not be retrieved because') . ' - ' . DB_error_msg($db);
$SalesResult = DB_query($sql, $db,$ErrMsg);

?>
<div id="area-graficos" class="clearfix">
<?php
echo '<table cellpadding=2 class=selection>';

echo'<tr>
    <th>' . _('Sunday') . '</th>
    <th>' . _('Monday') . '</th>
    <th>' . _('Tuesday') . '</th>
    <th>' . _('Wednesday') . '</th>
    <th>' . _('Thursday') . '</th>
    <th>' . _('Friday') . '</th>
    <th>' . _('Saturday') . '</th></tr>';

$CumulativeTotalSales = 0;
$CumulativeSales = 0;
$CumulativeTotalCost = 0;
$BilledDays = 0;
$CumulativeTotalFreight = 0; // Acumulador para flete

$CumulativeTotalDiscounts = 0;

$CumulativeTotalSalesDolares = 0;
$comisionVentas = 0;

$DaySalesArray = array();
while ($DaySalesRow=DB_fetch_array($SalesResult)) {
    $DaySalesArray[DayOfMonthFromSQLDate($DaySalesRow['trandate'])] = new Cart;
    $freightValue = isset($DaySalesRow['freightvalue_freight']) ? $DaySalesRow['freightvalue_freight'] : 0;
    
    if ($DaySalesRow['salesvalue'] > 0) {
        $DaySalesArray[DayOfMonthFromSQLDate($DaySalesRow['trandate'])]->Sales = $DaySalesRow['salesvalue'] + $DaySalesRow['salesvalueiva'] + $freightValue;
    } else {
        $DaySalesArray[DayOfMonthFromSQLDate($DaySalesRow['trandate'])]->Sales = 0;
    }
    
    if ($DaySalesRow['salesvalue'] > 0 ) {
        $DaySalesArray[DayOfMonthFromSQLDate($DaySalesRow['trandate'])]->GPPercent = ($DaySalesRow['salesvalue']-$DaySalesRow['cost'])/$DaySalesRow['salesvalue'];
    } else {
        $DaySalesArray[DayOfMonthFromSQLDate($DaySalesRow['trandate'])]->GPPercent = 0;
    }
    
    $BilledDays++;
    $CumulativeTotalSales += ($DaySalesRow['salesvalue'] + $DaySalesRow['salesvalueiva'] + $freightValue);
    $CumulativeTotalCost += $DaySalesRow['cost'];
    $CumulativeSales += $DaySalesRow['salesvalue'];
    $CumulativeTotalFreight += $freightValue;
    
    $CumulativeTotalDiscounts = $DaySalesRow['discoutsvalue'];
	
	$CumulativeTotalSalesDolares += $DaySalesRow['ventasDolares'];
	$comisionVentas = $DaySalesRow['comision_ventas'];
}

if( mysql_num_rows($SalesResult) == 0 ){
	$sql = "
		select
		
		ventas_mes_location.trandate_year_month,
		sum(
			if(
				ventas_mes_location.ventas <= if(metas_periodo.meta is null,0,metas_periodo.meta),
				ventas_mes_location.ventas * salesman.commissionrate1 / 100,
				if(metas_periodo.meta is null,0,metas_periodo.meta) * salesman.commissionrate1 / 100
				+
				( ventas_mes_location.ventas - if(metas_periodo.meta is null,0,metas_periodo.meta) ) * salesman.commissionrate2 / 100
			)
		) as comision,
		sum( ventas_mes_location.descuentos ) as descuentos
		
		from (
			select
			
			custbranch.salesman loccode,
			date_format(stockmoves.trandate,'%Y-%m') trandate_year_month,
			SUM( (( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) - ( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) * stockmoves.discountpercent)) + (( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) - ( (stockmoves.price / if( debtortrans.rate is null,1,debtortrans.rate )) * stockmoves.discountpercent)) * stockmovestaxes.taxrate)) * -stockmoves.qty ) ventas,
			SUM( stockmoves.price  / if( debtortrans.rate is null,1,debtortrans.rate ) * ( stockmoves.discountpercent ) * ( -stockmoves.qty ) ) as descuentos
			
			from stockmoves
				inner join custbranch on
					custbranch.branchcode = stockmoves.branchcode
				inner join stockmovestaxes on
					stockmovestaxes.stkmoveno = stockmoves.stkmoveno
				left join debtortrans on
					debtortrans.transno = stockmoves.transno
					
			";
			
			if( @$_POST["Salesperson"] == "Propios" ){
				$sql.="
					inner join locations on
						locations.loccode = custbranch.salesman
					inner join companies on
						companies.companynumber = locations.branchcode
				";
			}
			
			$sql.="
			where
				(stockmoves.type=10 or stockmoves.type=11)
				and date_format(stockmoves.trandate,'%Y-%m') = '" . $periodo_year_month . "'
			";
			if( @$_POST["Salesperson"] <> "Propios" and @$_POST["Salesperson"] <> "All" ){
				$sql.="
				and custbranch.salesman = '".@$_POST["Salesperson"]."'
				";
			}
			$sql.="

			group by
				trandate_year_month,
				custbranch.salesman
		) ventas_mes_location
		left join metas_periodo on
			metas_periodo.UserStockLocation = ventas_mes_location.loccode
			and metas_periodo.periodo = '" . @$_POST["MonthToShow"] . "'
		left join salesman on
			salesman.salesmancode = ventas_mes_location.loccode
	";
	$ejec = mysql_query($sql,$db);
	if(!$ejec){
		die( "Fallo al ejecutar el query en la línea ". __LINE__ . "<br>" . mysql_error($db) . '<br>SQL: ' . $sql );
	}
	if( $reg = mysql_fetch_assoc( $ejec ) ){
		$CumulativeTotalDiscounts = $reg['descuentos'];
		$comisionVentas = $reg['comision'];
	}
}

//end of while loop
echo '<tr>';
$ColumnCounter = DayOfWeekFromSQLDate($StartDateSQL);
for ($i=0;$i<$ColumnCounter;$i++){
    echo '<td></td>';
}
$DayNumber = 1;
/*Set up day number headings*/
for ($i=$ColumnCounter;$i<=6;$i++){
       echo '<th>' . $DayNumber . '</th>';
       $DayNumber++;
}
echo '</tr><tr>';
for ($i=0;$i<$ColumnCounter;$i++){
    echo '<td></td>';
}

$LastDayOfMonth = DayOfMonthFromSQLDate($EndDateSQL);
for ($i=1;$i<=$LastDayOfMonth;$i++){
        $ColumnCounter++;
        if(isset($DaySalesArray[$i])) {
            echo '<td class="number" style="outline: 1px solid gray;">' . number_format($DaySalesArray[$i]->Sales,2) . '<br />' .  number_format($DaySalesArray[$i]->GPPercent*100,1) . '%</td>';
        } else {
            echo '<td class="number" style="outline: 1px solid gray;">' . number_format(0,0) . '<br />' .  number_format(0,1) . '%</td>';
        }
        if ($ColumnCounter==7){
            echo '</tr><tr>';
                        for ($j=1;$j<=7;$j++){
                                   echo '<th>' . $DayNumber. '</th>';
                            $DayNumber++;
                            if($DayNumber>$LastDayOfMonth){
                               break;
                            }
                        }
                        echo '</tr><tr>';
            $ColumnCounter=0;
        }
}
if ($ColumnCounter!=0) {
    echo '</tr><tr>';
}

if ($CumulativeTotalSales !=0){
    $AverageGPPercent = ($CumulativeTotalSales - $CumulativeTotalCost)*100/$CumulativeTotalSales;
    $AverageDailySales = $CumulativeTotalSales/$BilledDays;
} else {
    $AverageGPPercent = 0;
    $AverageDailySales = 0;
}

if (isset($_POST['MonthToShow'])) {
    if ($_POST['Salesperson']=='All' or $_POST['Salesperson']=='Propios') {
       if( $_POST['Salesperson']=='All' ){
           $meta = get_meta_by_periodo($_POST['MonthToShow'],1,$db);
			$all = 1;
       }elseif( $_POST['Salesperson']=='Propios' ){
           
			$sql="
				SELECT
				metas_periodo.meta
				from metas_periodo
					inner join locations on
						locations.loccode = metas_periodo.UserStockLocation
					inner join companies on
						companies.companynumber = locations.branchcode
				where periodo = '".$_POST['MonthToShow']."'
			";
			$ejec=mysql_query($sql,$db);
			if(!$ejec){
				die("Fallo al ejecutar el query en la línea ". __LINE__ . "<br>" . mysql_error($db) . '<br>SQL: ' . $sql);
			}
			$meta = array();
			while($reg=mysql_fetch_array($ejec)){
				$meta[]=$reg;
			}
           
			$sql="
				SELECT
				avg(metas_periodo.tasa_dolar) promedio_tasa
				from metas_periodo
					inner join locations on
						locations.loccode = metas_periodo.UserStockLocation
					inner join companies on
						companies.companynumber = locations.branchcode
				where periodo = '".$_POST['MonthToShow']."'
			";
			$ejec=mysql_query($sql,$db);
			if(!$ejec){
				die("Fallo al ejecutar el query en la línea ". __LINE__ . "<br>" . mysql_error($db) . '<br>SQL: ' . $sql);
			}
			$reg = mysql_fetch_array($ejec);
			$meta_tasa_dolar = $reg["promedio_tasa"];
       }
    }else{
        $meta = get_meta_by_vendedor_periodo($_POST['Salesperson'],$_POST['MonthToShow'],$db);
        $no=1;
    }

    if (!isset($no) and is_array($meta) and count($meta) > 1) {
        $suma = 0;
        foreach ($meta as $key => $value) {
            $suma += $value['meta'];
        }
        $meta = array('meta'=>$suma);
		$meta['tasa_dolar'] = @$meta_tasa_dolar;
    }
}
if (isset($all)) {
    $meta['tasa_dolar'] = get_tasa_promedio($_POST['MonthToShow'],1,$db);
}

$CumulativeTotalSalesBs = $CumulativeTotalSales;
$CumulativeTotalSales = $CumulativeTotalSales/$meta['tasa_dolar'];

$CumulativeTotalDiscountsBs = $CumulativeTotalDiscounts;

$CumulativeSalesBs = $CumulativeSales;
$CumulativeSales = $CumulativeSales/$meta['tasa_dolar'];

// Buscar el porcentaje de la comision del vendedor
$sqlx = "SELECT commissionrate1, commissionrate2 FROM salesman WHERE salesmancode='".$_POST['Salesperson']."'";
$SalesManResult = DB_query($sqlx,$db);
$SalesManRow = DB_fetch_array($SalesManResult);

if($CumulativeTotalSalesDolares <= $meta['meta']){
    $Comision = $CumulativeTotalComisionDolares1;
}else{
    $Comision = $CumulativeTotalComisionDolares2;
}

// Fila 1: Total Sales
echo '<tr><th colspan=7>' . _('Total Sales for month') . ': ' . number_format($CumulativeTotalSalesBs,2) . '  ||  ' . _('GP%') . ': ' . number_format($AverageGPPercent,1) . '</th></tr>';

// Fila 2: Avg Daily Sales y Ventas con Impuestos
echo '<tr><th colspan=7>' . _('Avg Daily Sales') . ': ' . number_format($AverageDailySales,0) . ' ||  Ventas con Impuestos: $' . number_format($CumulativeTotalSalesDolares,2) . '</th></tr>';

// Fila 3: Fletes y Descuentos
echo '<tr><th colspan=7>Fletes: $' . number_format($CumulativeTotalFreight,2) . '   ||     Descuentos: $' . number_format($CumulativeTotalDiscounts,2) . '</th></tr>';

// Fila 4: Meta del periodo y Comisiones
echo '<tr><th colspan=7>Meta del periodo: ' . number_format($meta['meta'],2) . '    ||    Comisiones: $' . number_format($comisionVentas-$CumulativeTotalDiscounts,2) . ' </th></tr>';

echo '</table>';

?>
</div>
<style type="text/css">
#porcentaje{
    width:60%;
    height:80px;
    background-color:#FA5858;
    margin:auto;
    margin-top:22px;
    border-radius:4px;
}
#caja_porcentaje{
    background-color:#DF0101;
    color:white;
    font-size:30px;
    display:inline;
    padding:10px;
    top:23px;
    left:18px;
    border-radius:5px;
    position:relative;
}
#fondo_porcentaje,#linea_porcentaje{
    background-color:#DF0101;
    height:15px;
    width:78%;
    position:relative;
    left:140px;
    border-radius:4px;
}
#linea_porcentaje{
    background-color:white;
    left:0px;
    width:0%;
}  

</style>

<div id="porcentaje">
    <div id="caja_porcentaje">
        <span id="valor_porcentaje">0 %</span>
    </div>
    <div class="" id="fondo_porcentaje">
        <div id="linea_porcentaje">
            
        </div>
    </div>
</div>
<script type="text/javascript" src="jquery-ui/jquery-ui.js"></script>
<script src="javascripts/highcharts/code/highcharts.js"></script>
<script src="javascripts/highcharts/code/highcharts-3d.js"></script>
<script src="javascripts/highcharts/code/modules/exporting.js"></script>
<script type="text/javascript">
    $(document).ready(function(){
        <?php if(((float)$CumulativeTotalSales/(float)$meta['meta'])*100 > 100): ?>
            $("#linea_porcentaje").animate({
                width: "100%"
            }, {
                step  : function(now, fx){
                     $("#valor_porcentaje").text(parseInt(now)+"%");
                },
                duration: 5000,
                complete:function(){
                    $("#valor_porcentaje").text("<?php echo number_format(((float)$CumulativeTotalSales/(float)$meta['meta'])*100,0) ?> %");
                }
            });
        <?php else: ?>
            $("#linea_porcentaje").animate({
                width: "<?php echo number_format(((float)$CumulativeTotalSales/(float)$meta['meta'])*100,0) ?>%"
            }, {
                step  : function(now, fx){
                     $("#valor_porcentaje").text(parseInt(now)+"%");
                },
                duration: 5000
            });
        <?php endif; ?>
		
		$("#btn-cargar-grafico").on("click",function(e){
			e.preventDefault();
			$("#area-graficos").html('Cargando...');
			$.ajax({
				url: 'ajax/DailySalesInquiryGraficas.php',
				type: 'POST',
				dataType: 'json',
				data: {
					"location[]":$("#location").val(),
					"periodo[]":$("#periodo").val(),
					"graficos[]":1
				},
				success:function(respuesta){
					var x,y;
					$("#area-graficos").html('');
					$("#area-graficos").append('<div class="row"><div class="col-half" id="area-graficos-data"></div></div>');
					if(respuesta.error==false){
						
						var arraySeries = new Array();
						var arrayXAxisCategories = new Array();
						
						arraySeries.push({
							name: "Ventas",
							data: new Array()
						});
						arraySeries.push({
							name: "Costos",
							data: new Array()
						});
						
						for( var contDataSeries = 0; contDataSeries < respuesta.series[0].data.length; contDataSeries++ ){
							arraySeries[0].data.push({
								y: respuesta.series[0].data[contDataSeries].y
							});
							arrayXAxisCategories.push(respuesta.series[0].data[contDataSeries].fecha_corte);
						}
						for( var contDataSeries = 0; contDataSeries < respuesta.series[1].data.length; contDataSeries++ ){
							arraySeries[1].data.push({
								y: respuesta.series[1].data[contDataSeries].y
							});
						}
						
						Highcharts.chart('area-graficos-data', {
							chart: {
								type: 'column'
							},
							title: {
								text: "Ventas/Costos"
							},
							xAxis: {
								categories: arrayXAxisCategories
							},
							yAxis: {
								title: {
									text: ''
								},
								stackLabels: {
									enabled: false,
									style: {
										fontWeight: 'bold',
										color: ( // theme
											Highcharts.defaultOptions.title.style &&
											Highcharts.defaultOptions.title.style.color
										) || 'gray'
									}
								}
							},
							tooltip: {
								pointFormat: '{series.name} <b>{point.y:,.2f}</b>'
							},
							credits: {
								enabled: false
							},
							plotOptions: {
								column: {
									grouping: false,
									shadow: false,
									borderWidth: 0
								}
							},
							series: arraySeries
						});
						
					}else{
						console.log(respuesta.mensaje);
					}
				},
				error: function()
				{
					console.log("Ha ocurrido un error!");
				}
			})
		})
    });
</script>
<?php

include('includes/footer.inc');

?>