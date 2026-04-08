import streamlit as st
import pandas as pd

st.set_page_config(page_title="千秋梦多主题分析", layout="wide")

excel_path = "文本分析/BERTopic/千秋梦/InteractiveSheet_2026-04-07_千秋梦 多主题.xlsx"

try:
    df = pd.read_excel(excel_path)
    st.dataframe(df, use_container_width=True, hide_index=True)
except Exception as e:
    st.error(f"加载文件失败: {e}")