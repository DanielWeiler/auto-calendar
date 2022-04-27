import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'
import { Box } from '@mui/system'
import React from 'react'
import { Link } from 'react-router-dom'

const Header = (props: { title: string }) => {
  const { title } = props
  return (
    <Box className="header-container" sx={{ height: 47 }}>
      <div style={{ paddingTop: '6px' }}>{title}</div>
      <Link to="/">
        <IconButton aria-label="close" style={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Link>
    </Box>
  )
}

export default Header
