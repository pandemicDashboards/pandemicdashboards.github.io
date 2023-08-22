import xlrd
import json

def write_data(file_path, dict_data):
    with open(file_path, 'w+', encoding='utf-8') as f:
        f.write(json.dumps(dict_data, ensure_ascii=False))

wb = xlrd.open_workbook('../source_data/covid_dashboards_20230613-2.xlsx')
dashboard_list = xlrd.open_workbook('../source_data/covid dashboard list-0613 (1).xlsx')
websitPage = dashboard_list.sheets()[0]

def process_website_data(websitPage):
    websitDataDict = {}
    for i in range(1, len(websitPage.col_values(8))):
        webdict = {
            "Original_web": websitPage.row_values(i)[5],
            "new_web": websitPage.row_values(i)[8]
        }
        websitDataDict[str(int(websitPage.row_values(i)[0]))] = webdict
    return websitDataDict

def process_excel_data(wb, websitDataDict):
    sheet1 = wb.sheets()[0]
    nrows = sheet1.nrows
    data = {}

    data_dict = {}
    for i in range(2, nrows):
        key_header = "context"
        data_value = ''
        if sheet1.col_values(2)[i]:
            data_value = data_value + "Publisher Type" + ':' + sheet1.col_values(2)[i]
        data_dict["publisher-type"] = sheet1.col_values(2)[i]
        for j in range(8, 11):
            if j == 9:
                continue
            key = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes':
                if data_value == '':
                    data_value = data_value + key
                else:
                    data_value = data_value + ',' + key
            else:
                if len(value) == 0:
                    continue
                else:
                    if data_value == '':
                        data_value = data_value + key + ":" + value
                    else:
                        data_value = data_value + ',' + key + ":" + value
        data_value = data_value + ','

        data_value = data_value + "independent website" + ':' + sheet1.col_values(3)[i] + ','

        value_data = ""
        for j in range(4, 9):
            key = "targeted user"
            value_type = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes':
                if value_data == '':
                    value_data = value_data + key + ":" + value_type
                else:
                    value_data = value_data + '/' + value_type
        data_value = data_value + value_data + ','

        value_data = ""
        for j in range(10, 19):
            key = "content-type"
            value_type = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes' or value != '':
                if value_data == '':
                    value_data = value_data + key + ":" + value_type
                else:
                    value_data = value_data + '/' + value_type
        data_value = data_value + value_data
        data_dict[key_header] = data_value

        data_value = ""
        value_data = ""
        for j in range(20, 26):
            key = "Data"
            value_type = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes':
                if value_data == '':
                    value_data = value_data + key + ":" + value_type
                else:
                    value_data = value_data + '/' + value_type
        data_value = data_value + value_data + ','

        value_data = ""
        for j in range(27, 37):
            key = "Task Abstration"
            value_type = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes':
                if value_data == '':
                    value_data = value_data + key + ":" + value_type
                else:
                    value_data = value_data + '/' + value_type
        data_value = data_value + value_data
        data_dict["Data"] = data_value


        key_header = "VisualForms"
        data_value = ''
        for j in range(37, 49):
            key = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes':
                if data_value == '':
                    data_value = data_value + key
                else:
                    data_value = data_value + '/' + key
        data_value = 'Encoding' + ':' + data_value;

        data_dict[key_header] = data_value

        key_header = "Algorithms"
        data_value = ''
        for j in range(69, 73):
            key = sheet1.col_values(j)[1]
            value = sheet1.col_values(j)[i]
            if value == "no":
                continue
            elif value == 'yes':
                if data_value == '':
                    data_value = data_value + key
                else:
                    data_value = data_value + '/' + key

        data_value = key_header + ':' + data_value
        data_dict[key_header] = data_value

        ID = str(int(sheet1.col_values(0)[i]))
        data_dict.update(websitDataDict[ID])
        data_dict["publisher_name"] = sheet1.col_values(1)[i]
        data_dict["continent"] = sheet1.col_values(10)[i]
        data_dict["geo-level"] = sheet1.col_values(8)[i]
        data[ID] = data_dict

    return data


if __name__ == "__main__":
    websitDataDict = process_website_data(websitPage)
    processed_data = process_excel_data(wb, websitDataDict)

    output_json_file_path = "../deal_data/covid_data_3.json"
    write_data(output_json_file_path, processed_data)
